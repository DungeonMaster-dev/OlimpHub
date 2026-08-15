import type { Request, Response, RequestHandler } from "express";
import { and, eq } from "drizzle-orm";
import { codeforcesLinks, users } from "../../drizzle/schema";
import { getDb } from "../db";
import { appRouter } from "../routers";
import { sdk, type AuthenticatedUser } from "../_core/sdk";

type DailyProfileSyncResult =
  | { ok: true; skipped: "orphan" | "disabled" | "missing_user" }
  | {
      ok: true;
      linkId: number;
      submissionsImported: number;
      ratingChangesImported: number;
    };

export async function runDailyCodeforcesProfileSync(input: {
  taskUid: string;
  req: Request;
  res: Response;
}): Promise<DailyProfileSyncResult> {
  const db = await getDb();
  if (!db) throw new Error("database_unavailable");
  const link = (
    await db
      .select()
      .from(codeforcesLinks)
      .where(eq(codeforcesLinks.scheduleCronTaskUid, input.taskUid))
      .limit(1)
  )[0];
  if (!link) return { ok: true, skipped: "orphan" };
  if (link.dailySyncEnabled !== "enabled" || link.syncConsent !== "enabled") {
    return { ok: true, skipped: "disabled" };
  }
  const user = (
    await db.select().from(users).where(eq(users.id, link.userId)).limit(1)
  )[0];
  if (!user) return { ok: true, skipped: "missing_user" };

  const caller = appRouter.createCaller({
    user,
    req: input.req,
    res: input.res,
  });
  const submissions = await caller.olimp.codeforces.syncSubmissions();
  const rating = await caller.olimp.codeforces.syncRatingHistory();
  await db
    .update(codeforcesLinks)
    .set({ dailySyncLastRunAt: new Date() })
    .where(
      and(
        eq(codeforcesLinks.id, link.id),
        eq(codeforcesLinks.scheduleCronTaskUid, input.taskUid)
      )
    );
  return {
    ok: true,
    linkId: link.id,
    submissionsImported: submissions.importedCount,
    ratingChangesImported: rating.importedCount,
  };
}

export function createDailyCodeforcesProfileSyncHandler(
  input: {
    authenticateRequest?: (req: Request) => Promise<AuthenticatedUser>;
    run?: typeof runDailyCodeforcesProfileSync;
  } = {}
): RequestHandler {
  const authenticateRequest =
    input.authenticateRequest ?? (req => sdk.authenticateRequest(req));
  const run = input.run ?? runDailyCodeforcesProfileSync;
  return async (req, res) => {
    let cronUser: AuthenticatedUser;
    try {
      cronUser = await authenticateRequest(req);
    } catch {
      return res.status(403).json({ error: "cron_only" });
    }
    if (!cronUser.isCron || !cronUser.taskUid) {
      return res.status(403).json({ error: "cron_only" });
    }
    try {
      return res.json(await run({ taskUid: cronUser.taskUid, req, res }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return res.status(500).json({
        error: "daily_codeforces_profile_sync_failed",
        message,
        context: { taskUid: cronUser.taskUid, path: req.path },
        timestamp: new Date().toISOString(),
      });
    }
  };
}
