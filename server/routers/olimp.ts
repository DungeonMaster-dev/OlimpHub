import { TRPCError } from "@trpc/server";
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, gte, inArray, like, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
  activityEvents,
  codeforcesLinks,
  externalSubmissions,
  idempotencyReceipts,
  problemHints,
  problemNotes,
  problems,
  problemSkills,
  skillEdges,
  skills,
  solvingAttempts,
  sourceSyncStates,
  trainingItems,
  trainingSessions,
  userProblemProgress,
  userSettings,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import {
  buildAnalyticsEvidence,
  nextPermittedHintLevel,
  normalizeCodeforcesHandle,
} from "../domain/learning";
import { createActivityEventId } from "../domain/idempotency";
import {
  canBeginCodeforcesSync,
  nextTrainingItemStatus,
  normalizeCatalogueInput,
  shouldWriteAttemptTransition,
} from "../domain/workflows";
import { codeforcesAdapter } from "../sources/codeforces";
import {
  catalogueSnapshotFingerprint,
  collectNewSubmissionPages,
  nextSubmissionCursor,
} from "../domain/ingestion";

const statusSchema = z.enum([
  "not_started",
  "planned",
  "in_progress",
  "paused",
  "solved",
  "review",
  "skipped",
  "archived",
]);
const attemptStateSchema = z.enum([
  "active",
  "paused",
  "completed",
  "abandoned",
]);
const outcomeSchema = z.enum(["solved", "not_solved", "partial", "unknown"]);
const periodSchema = z.union([z.literal(7), z.literal(30), z.literal(90)]);

async function requireDb() {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database is temporarily unavailable.",
    });
  return db;
}

async function writeActivity(input: {
  userId: number;
  eventType: string;
  attemptId?: number | null;
  problemId?: number | null;
  metadata?: Record<string, unknown>;
  clientEventId?: string;
}) {
  const db = await requireDb();
  const values = {
    userId: input.userId,
    attemptId: input.attemptId ?? null,
    problemId: input.problemId ?? null,
    eventType: input.eventType,
    metadata: input.metadata ?? {},
    clientEventId: input.clientEventId ?? createActivityEventId(input),
  };
  await db
    .insert(activityEvents)
    .values(values)
    .onDuplicateKeyUpdate({ set: { clientEventId: values.clientEventId } });
}

async function beginMutationReceipt(
  userId: number,
  operation: string,
  requestId?: string
) {
  if (!requestId)
    return {
      replay: null as Record<string, unknown> | null,
      ownerToken: null as string | null,
    };
  const db = await requireDb();
  const ownerToken = randomUUID();
  await db
    .insert(idempotencyReceipts)
    .values({ userId, operation, requestId, ownerToken })
    .onDuplicateKeyUpdate({ set: { requestId: sql`requestId` } });
  const receipt = (
    await db
      .select()
      .from(idempotencyReceipts)
      .where(
        and(
          eq(idempotencyReceipts.userId, userId),
          eq(idempotencyReceipts.operation, operation),
          eq(idempotencyReceipts.requestId, requestId)
        )
      )
      .limit(1)
  )[0]!;
  if (receipt.ownerToken === ownerToken)
    return { replay: null as Record<string, unknown> | null, ownerToken };
  if (receipt.status === "completed" && receipt.response)
    return { replay: receipt.response, ownerToken: null };
  throw new TRPCError({
    code: "CONFLICT",
    message:
      "An identical request is already being processed. Retry after it completes.",
  });
}

async function completeMutationReceipt(
  userId: number,
  operation: string,
  requestId: string | undefined,
  ownerToken: string | null,
  response: Record<string, unknown>
) {
  if (!requestId || !ownerToken) return;
  const db = await requireDb();
  await db
    .update(idempotencyReceipts)
    .set({ status: "completed", response })
    .where(
      and(
        eq(idempotencyReceipts.userId, userId),
        eq(idempotencyReceipts.operation, operation),
        eq(idempotencyReceipts.requestId, requestId),
        eq(idempotencyReceipts.ownerToken, ownerToken)
      )
    );
}

async function failMutationReceipt(
  userId: number,
  operation: string,
  requestId: string | undefined,
  ownerToken: string | null
) {
  if (!requestId || !ownerToken) return;
  const db = await requireDb();
  await db
    .update(idempotencyReceipts)
    .set({ status: "failed" })
    .where(
      and(
        eq(idempotencyReceipts.userId, userId),
        eq(idempotencyReceipts.operation, operation),
        eq(idempotencyReceipts.requestId, requestId),
        eq(idempotencyReceipts.ownerToken, ownerToken)
      )
    );
}

async function withMutationReceipt<T extends Record<string, unknown>>(
  userId: number,
  operation: string,
  requestId: string | undefined,
  work: () => Promise<T>
) {
  const receipt = await beginMutationReceipt(userId, operation, requestId);
  if (receipt.replay) return receipt.replay as T;
  try {
    const response = await work();
    await completeMutationReceipt(
      userId,
      operation,
      requestId,
      receipt.ownerToken,
      response
    );
    return response;
  } catch (error) {
    await failMutationReceipt(userId, operation, requestId, receipt.ownerToken);
    throw error;
  }
}

async function getOwnedAttempt(userId: number, attemptId: number) {
  const db = await requireDb();
  const attempt = (
    await db
      .select()
      .from(solvingAttempts)
      .where(
        and(
          eq(solvingAttempts.id, attemptId),
          eq(solvingAttempts.userId, userId)
        )
      )
      .limit(1)
  )[0];
  if (!attempt)
    throw new TRPCError({ code: "NOT_FOUND", message: "Attempt not found." });
  return attempt;
}

async function ensureSettings(userId: number) {
  const db = await requireDb();
  await db
    .insert(userSettings)
    .values({ userId })
    .onDuplicateKeyUpdate({ set: { userId } });
  return (
    await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1)
  )[0]!;
}

async function beginCodeforcesSync(scopeKey: string) {
  const db = await requireDb();
  const existing = (
    await db
      .select()
      .from(sourceSyncStates)
      .where(
        and(
          eq(sourceSyncStates.sourceId, "codeforces"),
          eq(sourceSyncStates.scopeKey, scopeKey)
        )
      )
      .limit(1)
  )[0];
  const now = new Date();
  if (!canBeginCodeforcesSync(existing?.lastStartedAt, now)) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Please wait one minute before repeating this Codeforces sync.",
    });
  }
  await db
    .insert(sourceSyncStates)
    .values({
      sourceId: "codeforces",
      scopeKey,
      status: "running",
      lastStartedAt: now,
      lastFinishedAt: null,
      lastError: null,
    })
    .onDuplicateKeyUpdate({
      set: {
        status: "running",
        lastStartedAt: now,
        lastFinishedAt: null,
        lastError: null,
      },
    });
  return { db, cursor: existing?.cursor ?? null };
}

async function finishCodeforcesSync(
  db: Awaited<ReturnType<typeof requireDb>>,
  scopeKey: string,
  error?: unknown,
  cursor?: string
) {
  const failed =
    error instanceof Error
      ? error.message.slice(0, 500)
      : error
        ? "Unknown synchronization failure."
        : null;
  await db
    .update(sourceSyncStates)
    .set({
      status: failed ? "failed" : "succeeded",
      lastFinishedAt: new Date(),
      lastError: failed,
      ...(failed || cursor === undefined ? {} : { cursor }),
    })
    .where(
      and(
        eq(sourceSyncStates.sourceId, "codeforces"),
        eq(sourceSyncStates.scopeKey, scopeKey)
      )
    );
}

export const olimpRouter = router({
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const settings = await ensureSettings(ctx.user.id);
    const activeAttempts = await db
      .select({ attempt: solvingAttempts, problem: problems })
      .from(solvingAttempts)
      .innerJoin(problems, eq(solvingAttempts.problemId, problems.id))
      .where(
        and(
          eq(solvingAttempts.userId, ctx.user.id),
          inArray(solvingAttempts.state, ["active", "paused"])
        )
      )
      .orderBy(desc(solvingAttempts.updatedAt))
      .limit(4);
    const recentActivity = await db
      .select()
      .from(activityEvents)
      .where(eq(activityEvents.userId, ctx.user.id))
      .orderBy(desc(activityEvents.occurredAt))
      .limit(6);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklySolved = await db
      .select({ count: sql<number>`count(*)` })
      .from(userProblemProgress)
      .where(
        and(
          eq(userProblemProgress.userId, ctx.user.id),
          eq(userProblemProgress.status, "solved"),
          gte(userProblemProgress.solvedAt, sevenDaysAgo)
        )
      );
    return {
      settings,
      activeAttempts,
      recentActivity,
      weeklySolved: Number(weeklySolved[0]?.count ?? 0),
      todayFocus: activeAttempts[0] ?? null,
    };
  }),

  catalogue: router({
    list: protectedProcedure
      .input(
        z.object({
          query: z.string().trim().max(120).optional(),
          source: z.string().trim().max(64).optional(),
          skillId: z.number().int().positive().optional(),
          tag: z.string().trim().max(64).optional(),
          minDifficulty: z.number().int().min(0).max(5000).optional(),
          maxDifficulty: z.number().int().min(0).max(5000).optional(),
          page: z.number().int().min(0).max(1000).default(0),
          pageSize: z.number().int().min(1).max(48).default(18),
        })
      )
      .query(async ({ ctx, input }) => {
        const db = await requireDb();
        const filter = normalizeCatalogueInput(input);
        const conditions = [];
        if (filter.source)
          conditions.push(eq(problems.sourceId, filter.source));
        if (filter.minDifficulty !== undefined)
          conditions.push(gte(problems.difficulty, filter.minDifficulty));
        if (input.maxDifficulty !== undefined)
          conditions.push(
            sql`${problems.difficulty} <= ${input.maxDifficulty}`
          );
        if (filter.query) {
          const pattern = `%${filter.query.replace(/[\\%_]/g, "\\$&")}%`;
          conditions.push(
            or(
              like(problems.title, pattern),
              sql`JSON_SEARCH(${problems.tags}, 'one', ${filter.query}) IS NOT NULL`
            )!
          );
        }
        let problemIds: number[] | undefined;
        if (filter.skillId) {
          const linked = await db
            .select({ problemId: problemSkills.problemId })
            .from(problemSkills)
            .where(eq(problemSkills.skillId, filter.skillId));
          problemIds = linked.map(row => row.problemId);
          if (!problemIds.length) return { items: [], total: 0 };
          conditions.push(inArray(problems.id, problemIds));
        }
        const raw = await db
          .select()
          .from(problems)
          .where(conditions.length ? and(...conditions) : undefined)
          .orderBy(asc(problems.difficulty), asc(problems.title))
          .limit(input.pageSize * 3)
          .offset(input.page * input.pageSize);
        const filtered = filter.tag
          ? raw.filter(problem => problem.tags.includes(filter.tag!))
          : raw;
        const page = filtered.slice(0, input.pageSize);
        const progressRows = page.length
          ? await db
              .select()
              .from(userProblemProgress)
              .where(
                and(
                  eq(userProblemProgress.userId, ctx.user.id),
                  inArray(
                    userProblemProgress.problemId,
                    page.map(problem => problem.id)
                  )
                )
              )
          : [];
        const progressByProblem = new Map(
          progressRows.map(progress => [progress.problemId, progress])
        );
        return {
          items: page.map(problem => ({
            problem,
            progress: progressByProblem.get(problem.id) ?? null,
          })),
          total: filtered.length,
        };
      }),
    detail: protectedProcedure
      .input(z.object({ problemId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const db = await requireDb();
        const problem = (
          await db
            .select()
            .from(problems)
            .where(eq(problems.id, input.problemId))
            .limit(1)
        )[0];
        if (!problem)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Problem not found.",
          });
        const [progress] = await db
          .select()
          .from(userProblemProgress)
          .where(
            and(
              eq(userProblemProgress.userId, ctx.user.id),
              eq(userProblemProgress.problemId, input.problemId)
            )
          )
          .limit(1);
        const skillRows = await db
          .select({ skill: skills, link: problemSkills })
          .from(problemSkills)
          .innerJoin(skills, eq(problemSkills.skillId, skills.id))
          .where(eq(problemSkills.problemId, input.problemId));
        return { problem, progress: progress ?? null, skills: skillRows };
      }),
  }),

  submissions: router({
    list: protectedProcedure
      .input(
        z.object({
          verdict: z.string().trim().max(64).optional(),
          page: z.number().int().min(0).max(1000).default(0),
          pageSize: z.number().int().min(1).max(50).default(25),
        })
      )
      .query(async ({ ctx, input }) => {
        const db = await requireDb();
        const conditions = [eq(externalSubmissions.userId, ctx.user.id)];
        if (input.verdict)
          conditions.push(eq(externalSubmissions.verdict, input.verdict));
        const [items, totals] = await Promise.all([
          db
            .select({ submission: externalSubmissions, problem: problems })
            .from(externalSubmissions)
            .leftJoin(problems, eq(externalSubmissions.problemId, problems.id))
            .where(and(...conditions))
            .orderBy(desc(externalSubmissions.submittedAt))
            .limit(input.pageSize)
            .offset(input.page * input.pageSize),
          db
            .select({ count: sql<number>`count(*)` })
            .from(externalSubmissions)
            .where(and(...conditions)),
        ]);
        const verdicts = await db
          .selectDistinct({ verdict: externalSubmissions.verdict })
          .from(externalSubmissions)
          .where(eq(externalSubmissions.userId, ctx.user.id))
          .orderBy(asc(externalSubmissions.verdict));
        return {
          items,
          total: Number(totals[0]?.count ?? 0),
          verdicts: verdicts.map(row => row.verdict),
        };
      }),
  }),

  workspace: router({
    start: protectedProcedure
      .input(z.object({ problemId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        const problem = (
          await db
            .select({ id: problems.id })
            .from(problems)
            .where(eq(problems.id, input.problemId))
            .limit(1)
        )[0];
        if (!problem)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Problem not found.",
          });
        const now = new Date();
        await db
          .insert(userProblemProgress)
          .values({
            userId: ctx.user.id,
            problemId: input.problemId,
            status: "in_progress",
            firstStartedAt: now,
            lastActivityAt: now,
          })
          .onDuplicateKeyUpdate({
            set: { status: "in_progress", lastActivityAt: now },
          });
        const existing = (
          await db
            .select()
            .from(solvingAttempts)
            .where(
              and(
                eq(solvingAttempts.userId, ctx.user.id),
                eq(solvingAttempts.problemId, input.problemId),
                inArray(solvingAttempts.state, ["active", "paused"])
              )
            )
            .orderBy(desc(solvingAttempts.updatedAt))
            .limit(1)
        )[0];
        const attempt =
          existing ??
          (
            await db
              .insert(solvingAttempts)
              .values({ userId: ctx.user.id, problemId: input.problemId })
              .$returningId()
          )[0];
        const resolvedAttempt =
          existing ??
          (
            await db
              .select()
              .from(solvingAttempts)
              .where(eq(solvingAttempts.id, attempt!.id))
              .limit(1)
          )[0];
        await writeActivity({
          userId: ctx.user.id,
          problemId: input.problemId,
          attemptId: resolvedAttempt.id,
          eventType: existing ? "attempt_resumed" : "attempt_started",
        });
        return resolvedAttempt;
      }),
    setAttemptState: protectedProcedure
      .input(
        z.object({
          attemptId: z.number().int().positive(),
          state: attemptStateSchema,
          outcome: outcomeSchema.optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        const attempt = await getOwnedAttempt(ctx.user.id, input.attemptId);
        const requestedOutcome = input.outcome ?? attempt.outcome;
        if (
          !shouldWriteAttemptTransition(
            attempt.state,
            input.state,
            attempt.outcome,
            requestedOutcome
          )
        )
          return { success: true, deduplicated: true };
        const now = new Date();
        const values = {
          state: input.state,
          outcome: requestedOutcome,
          pausedAt: input.state === "paused" ? now : null,
          endedAt: ["completed", "abandoned"].includes(input.state)
            ? now
            : null,
        } as const;
        await db
          .update(solvingAttempts)
          .set(values)
          .where(eq(solvingAttempts.id, attempt.id));
        if (input.state === "completed" && values.outcome === "solved") {
          await db
            .insert(userProblemProgress)
            .values({
              userId: ctx.user.id,
              problemId: attempt.problemId,
              status: "solved",
              sourceOfTruth: "user_declared",
              solvedAt: now,
              lastActivityAt: now,
            })
            .onDuplicateKeyUpdate({
              set: {
                status: "solved",
                sourceOfTruth: "user_declared",
                solvedAt: now,
                lastActivityAt: now,
              },
            });
        } else if (input.state === "paused") {
          await db
            .update(userProblemProgress)
            .set({ status: "paused", lastActivityAt: now })
            .where(
              and(
                eq(userProblemProgress.userId, ctx.user.id),
                eq(userProblemProgress.problemId, attempt.problemId)
              )
            );
        }
        await writeActivity({
          userId: ctx.user.id,
          attemptId: attempt.id,
          problemId: attempt.problemId,
          eventType: `attempt_${input.state}`,
          metadata: { outcome: values.outcome },
        });
        return { success: true };
      }),
    setStatus: protectedProcedure
      .input(
        z.object({
          problemId: z.number().int().positive(),
          status: statusSchema,
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        const now = new Date();
        await db
          .insert(userProblemProgress)
          .values({
            userId: ctx.user.id,
            problemId: input.problemId,
            status: input.status,
            sourceOfTruth: "user_declared",
            solvedAt: input.status === "solved" ? now : null,
            lastActivityAt: now,
          })
          .onDuplicateKeyUpdate({
            set: {
              status: input.status,
              sourceOfTruth: "user_declared",
              solvedAt: input.status === "solved" ? now : null,
              lastActivityAt: now,
            },
          });
        await writeActivity({
          userId: ctx.user.id,
          problemId: input.problemId,
          eventType: "problem_status_changed",
          metadata: { status: input.status },
        });
        return { success: true };
      }),
    notes: protectedProcedure
      .input(
        z.object({
          problemId: z.number().int().positive(),
          attemptId: z.number().int().positive().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        const db = await requireDb();
        return db
          .select()
          .from(problemNotes)
          .where(
            and(
              eq(problemNotes.userId, ctx.user.id),
              eq(problemNotes.problemId, input.problemId)
            )
          )
          .orderBy(desc(problemNotes.updatedAt));
      }),
    saveNote: protectedProcedure
      .input(
        z.object({
          noteId: z.number().int().positive().optional(),
          problemId: z.number().int().positive(),
          attemptId: z.number().int().positive().optional(),
          content: z.string().trim().min(1).max(12_000),
          requestId: z.string().uuid().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        return withMutationReceipt(
          ctx.user.id,
          "workspace.save_note",
          input.requestId,
          async () => {
            if (input.attemptId)
              await getOwnedAttempt(ctx.user.id, input.attemptId);
            if (input.noteId) {
              const note = (
                await db
                  .select()
                  .from(problemNotes)
                  .where(
                    and(
                      eq(problemNotes.id, input.noteId),
                      eq(problemNotes.userId, ctx.user.id)
                    )
                  )
                  .limit(1)
              )[0];
              if (!note)
                throw new TRPCError({
                  code: "NOT_FOUND",
                  message: "Note not found.",
                });
              await db
                .update(problemNotes)
                .set({
                  content: input.content,
                  revision: note.revision + 1,
                  attemptId: input.attemptId ?? note.attemptId,
                })
                .where(eq(problemNotes.id, note.id));
              return { id: note.id };
            }
            const inserted = await db
              .insert(problemNotes)
              .values({
                userId: ctx.user.id,
                problemId: input.problemId,
                attemptId: input.attemptId ?? null,
                content: input.content,
              })
              .$returningId();
            await writeActivity({
              userId: ctx.user.id,
              problemId: input.problemId,
              attemptId: input.attemptId,
              eventType: "note_saved",
            });
            return inserted[0]!;
          }
        );
      }),
    nextHint: protectedProcedure
      .input(z.object({ attemptId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        const attempt = await getOwnedAttempt(ctx.user.id, input.attemptId);
        const nextLevel = nextPermittedHintLevel(attempt.highestHintLevel);
        const hint = (
          await db
            .select()
            .from(problemHints)
            .where(
              and(
                eq(problemHints.problemId, attempt.problemId),
                eq(problemHints.level, nextLevel)
              )
            )
            .limit(1)
        )[0];
        if (!hint)
          throw new TRPCError({
            code: "NOT_FOUND",
            message:
              "The next approved hint is not available for this problem.",
          });
        await db
          .update(solvingAttempts)
          .set({ highestHintLevel: nextLevel })
          .where(
            and(
              eq(solvingAttempts.id, attempt.id),
              eq(solvingAttempts.highestHintLevel, attempt.highestHintLevel)
            )
          );
        await writeActivity({
          userId: ctx.user.id,
          attemptId: attempt.id,
          problemId: attempt.problemId,
          eventType: "hint_revealed",
          metadata: { level: nextLevel },
        });
        return { level: nextLevel, content: hint.content };
      }),
  }),

  training: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await requireDb();
      return db
        .select()
        .from(trainingSessions)
        .where(eq(trainingSessions.userId, ctx.user.id))
        .orderBy(desc(trainingSessions.updatedAt));
    }),
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().trim().min(3).max(180),
          problemIds: z.array(z.number().int().positive()).min(1).max(20),
          requestId: z.string().uuid().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        return withMutationReceipt(
          ctx.user.id,
          "training.create",
          input.requestId,
          async () => {
            const existingProblems = await db
              .select({ id: problems.id })
              .from(problems)
              .where(inArray(problems.id, input.problemIds));
            if (existingProblems.length !== input.problemIds.length)
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "A selected problem is unavailable.",
              });
            const sessionId = (
              await db
                .insert(trainingSessions)
                .values({
                  userId: ctx.user.id,
                  title: input.title,
                  status: "active",
                  startedAt: new Date(),
                })
                .$returningId()
            )[0]!.id;
            await db.insert(trainingItems).values(
              input.problemIds.map((problemId, position) => ({
                sessionId,
                problemId,
                position,
                status:
                  position === 0 ? ("active" as const) : ("queued" as const),
              }))
            );
            await writeActivity({
              userId: ctx.user.id,
              eventType: "training_started",
              metadata: { sessionId, problemCount: input.problemIds.length },
            });
            return { id: sessionId };
          }
        );
      }),
    detail: protectedProcedure
      .input(z.object({ sessionId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const db = await requireDb();
        const session = (
          await db
            .select()
            .from(trainingSessions)
            .where(
              and(
                eq(trainingSessions.id, input.sessionId),
                eq(trainingSessions.userId, ctx.user.id)
              )
            )
            .limit(1)
        )[0];
        if (!session)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Training session not found.",
          });
        const items = await db
          .select({ item: trainingItems, problem: problems })
          .from(trainingItems)
          .innerJoin(problems, eq(trainingItems.problemId, problems.id))
          .where(eq(trainingItems.sessionId, session.id))
          .orderBy(asc(trainingItems.position));
        return { session, items };
      }),
    updateItem: protectedProcedure
      .input(
        z.object({
          sessionId: z.number().int().positive(),
          itemId: z.number().int().positive(),
          status: z.enum(["queued", "active", "completed", "skipped"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        const session = (
          await db
            .select()
            .from(trainingSessions)
            .where(
              and(
                eq(trainingSessions.id, input.sessionId),
                eq(trainingSessions.userId, ctx.user.id)
              )
            )
            .limit(1)
        )[0];
        if (!session)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Training session not found.",
          });
        const item = (
          await db
            .select()
            .from(trainingItems)
            .where(
              and(
                eq(trainingItems.id, input.itemId),
                eq(trainingItems.sessionId, input.sessionId)
              )
            )
            .limit(1)
        )[0];
        if (!item)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Training item not found.",
          });
        const nextStatus = nextTrainingItemStatus(item.status, input.status);
        if (nextStatus === item.status)
          return { success: true, deduplicated: true };
        await db
          .update(trainingItems)
          .set({
            status: nextStatus,
            completedAt: nextStatus === "completed" ? new Date() : null,
          })
          .where(eq(trainingItems.id, item.id));
        return { success: true };
      }),
  }),

  skills: router({
    map: protectedProcedure.query(async () => {
      const db = await requireDb();
      const [nodes, edges, links] = await Promise.all([
        db
          .select()
          .from(skills)
          .where(eq(skills.status, "approved"))
          .orderBy(asc(skills.title)),
        db.select().from(skillEdges),
        db
          .select({ link: problemSkills, problem: problems })
          .from(problemSkills)
          .innerJoin(problems, eq(problemSkills.problemId, problems.id)),
      ]);
      return { nodes, edges, links };
    }),
  }),

  analytics: router({
    summary: protectedProcedure
      .input(z.object({ periodDays: periodSchema.default(30) }))
      .query(async ({ ctx, input }) => {
        const db = await requireDb();
        const start = new Date(
          Date.now() - input.periodDays * 24 * 60 * 60 * 1000
        );
        const [solved, attempts, active, activity] = await Promise.all([
          db
            .select()
            .from(userProblemProgress)
            .where(
              and(
                eq(userProblemProgress.userId, ctx.user.id),
                eq(userProblemProgress.status, "solved"),
                gte(userProblemProgress.solvedAt, start)
              )
            ),
          db
            .select()
            .from(solvingAttempts)
            .where(
              and(
                eq(solvingAttempts.userId, ctx.user.id),
                gte(solvingAttempts.startedAt, start)
              )
            ),
          db
            .select()
            .from(solvingAttempts)
            .where(
              and(
                eq(solvingAttempts.userId, ctx.user.id),
                inArray(solvingAttempts.state, ["active", "paused"])
              )
            ),
          db
            .select()
            .from(activityEvents)
            .where(
              and(
                eq(activityEvents.userId, ctx.user.id),
                gte(activityEvents.occurredAt, start)
              )
            )
            .orderBy(desc(activityEvents.occurredAt))
            .limit(12),
        ]);
        const metrics = {
          solvedProblems: solved.length,
          startedAttempts: attempts.length,
          activeAttempts: active.length,
          trackedEvents: activity.length,
        };
        const evidence = buildAnalyticsEvidence(metrics);
        return {
          period: {
            days: input.periodDays,
            startsAt: start,
            endsAt: new Date(),
          },
          calculationVersion: "v1",
          metrics,
          evidence,
          activity,
        };
      }),
  }),

  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const db = await requireDb();
      const settings = await ensureSettings(ctx.user.id);
      const codeforces =
        (
          await db
            .select()
            .from(codeforcesLinks)
            .where(eq(codeforcesLinks.userId, ctx.user.id))
            .limit(1)
        )[0] ?? null;
      return { settings, codeforces };
    }),
    update: protectedProcedure
      .input(
        z.object({
          timeZone: z.string().trim().min(1).max(64),
          weeklyGoal: z.number().int().min(1).max(30),
          activityTracking: z.enum(["enabled", "minimal"]),
          notificationOptIn: z.enum(["enabled", "disabled"]),
          analyticsPeriodDays: periodSchema,
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        await ensureSettings(ctx.user.id);
        await db
          .update(userSettings)
          .set(input)
          .where(eq(userSettings.userId, ctx.user.id));
        return { success: true };
      }),
    setCodeforcesHandle: protectedProcedure
      .input(
        z.object({
          handle: z
            .string()
            .trim()
            .regex(/^[A-Za-z0-9_.-]{3,64}$/),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await requireDb();
        const normalizedHandle = normalizeCodeforcesHandle(input.handle);
        await db
          .insert(codeforcesLinks)
          .values({
            userId: ctx.user.id,
            handle: input.handle,
            normalizedHandle,
          })
          .onDuplicateKeyUpdate({
            set: {
              handle: input.handle,
              normalizedHandle,
              verificationStatus: "declared_public",
              syncConsent: "enabled",
            },
          });
        return { success: true };
      }),
  }),

  codeforces: router({
    syncCatalogue: protectedProcedure.mutation(async ({ ctx }) => {
      const scopeKey = "catalogue";
      const sync = await beginCodeforcesSync(scopeKey);
      const { db } = sync;
      try {
        const snapshot = await codeforcesAdapter.fetchProblemSnapshot();
        if (snapshot.status !== "success")
          throw new TRPCError({
            code: "BAD_GATEWAY",
            message: snapshot.message,
          });
        const records = snapshot.data.map(problem => ({
          sourceId: codeforcesAdapter.sourceId,
          externalKey: problem.externalKey,
          title: problem.title,
          sourceUrl: problem.sourceUrl,
          difficulty: problem.difficulty,
          tags: problem.tags,
          accessMode: "external_link" as const,
          sourceUpdatedAt: null,
        }));
        const fingerprint = catalogueSnapshotFingerprint(snapshot.data);
        if (sync.cursor === fingerprint) {
          await writeActivity({
            userId: ctx.user.id,
            eventType: "codeforces_catalogue_unchanged",
            metadata: { snapshotFingerprint: fingerprint },
          });
          await finishCodeforcesSync(db, scopeKey, undefined, fingerprint);
          return { importedCount: 0, unchanged: true };
        }
        for (let offset = 0; offset < records.length; offset += 400) {
          const batch = records.slice(offset, offset + 400);
          await db
            .insert(problems)
            .values(batch)
            .onDuplicateKeyUpdate({
              set: {
                title: sql`VALUES(title)`,
                sourceUrl: sql`VALUES(sourceUrl)`,
                difficulty: sql`VALUES(difficulty)`,
                tags: sql`VALUES(tags)`,
                importedAt: new Date(),
              },
            });
        }
        await writeActivity({
          userId: ctx.user.id,
          eventType: "codeforces_catalogue_synced",
          metadata: { importedCount: records.length },
        });
        await finishCodeforcesSync(db, scopeKey, undefined, fingerprint);
        return { importedCount: records.length, unchanged: false };
      } catch (error) {
        await finishCodeforcesSync(db, scopeKey, error);
        throw error;
      }
    }),
    syncSubmissions: protectedProcedure.mutation(async ({ ctx }) => {
      const scopeKey = `submissions:${ctx.user.id}`;
      const sync = await beginCodeforcesSync(scopeKey);
      const { db } = sync;
      try {
        const link = (
          await db
            .select()
            .from(codeforcesLinks)
            .where(
              and(
                eq(codeforcesLinks.userId, ctx.user.id),
                eq(codeforcesLinks.syncConsent, "enabled")
              )
            )
            .limit(1)
        )[0];
        if (!link)
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "Link a Codeforces handle before synchronizing public verdicts.",
          });
        const collected = await collectNewSubmissionPages({
          cursor: sync.cursor,
          pageSize: 1000,
          fetchPage: (from, count) =>
            codeforcesAdapter.fetchSubmissionsPage({
              handle: link.handle,
              from,
              count,
            }),
        });
        if (collected.status !== "success")
          throw new TRPCError({
            code: "BAD_GATEWAY",
            message: collected.message,
          });
        const submissions = collected.data.items;
        const keys = submissions.map(
          submission => submission.externalProblemKey
        );
        const knownProblems = keys.length
          ? await db
              .select()
              .from(problems)
              .where(
                and(
                  eq(problems.sourceId, "codeforces"),
                  inArray(problems.externalKey, keys)
                )
              )
          : [];
        const problemByKey = new Map(
          knownProblems.map(problem => [problem.externalKey, problem.id])
        );
        const records = submissions.map(submission => ({
          userId: ctx.user.id,
          sourceId: codeforcesAdapter.sourceId,
          externalSubmissionId: submission.externalSubmissionId,
          problemId: problemByKey.get(submission.externalProblemKey) ?? null,
          externalProblemKey: submission.externalProblemKey,
          verdict: submission.verdict,
          language: submission.language,
          submittedAt: submission.submittedAt,
        }));
        for (let offset = 0; offset < records.length; offset += 400) {
          await db
            .insert(externalSubmissions)
            .values(records.slice(offset, offset + 400))
            .onDuplicateKeyUpdate({
              set: {
                verdict: sql`VALUES(verdict)`,
                language: sql`VALUES(language)`,
                observedAt: new Date(),
              },
            });
        }
        await db
          .update(codeforcesLinks)
          .set({
            lastSyncedAt: new Date(),
            verificationStatus: "declared_public",
          })
          .where(eq(codeforcesLinks.id, link.id));
        await writeActivity({
          userId: ctx.user.id,
          eventType: "codeforces_submissions_synced",
          metadata: { importedCount: records.length },
        });
        const nextCursor = nextSubmissionCursor(sync.cursor, submissions);
        const newSinceCursor = submissions.length;
        await finishCodeforcesSync(db, scopeKey, undefined, nextCursor);
        return {
          importedCount: records.length,
          newSinceCursor,
          handle: link.handle,
          scannedPages: collected.data.scannedPages,
        };
      } catch (error) {
        await finishCodeforcesSync(db, scopeKey, error);
        throw error;
      }
    }),
  }),
});
