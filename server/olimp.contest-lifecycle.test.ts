import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  selectResults: [] as unknown[][],
  updates: [] as Array<Record<string, unknown>>,
  writes: [] as Array<Record<string, unknown>>,
  generateStructured: vi.fn(),
}));

vi.mock("./db", () => ({ getDb: mocks.getDb }));
vi.mock("./ai/modelProvider", () => ({
  generateStructured: mocks.generateStructured,
}));

import { appRouter } from "./routers";

function userContext(): TrpcContext {
  return {
    user: { id: 1, openId: "user-1", role: "user", name: null },
    req: { headers: {}, protocol: "https" } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("virtual contest lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.selectResults = [];
    mocks.updates = [];
    mocks.writes = [];
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => {
          const rows = mocks.selectResults.shift() ?? [];
          const orderedResult = {
            limit: vi.fn(async () => rows),
            then: <TResult>(
              onFulfilled: (value: unknown[]) => TResult | PromiseLike<TResult>
            ) => Promise.resolve(rows).then(onFulfilled),
          };
          const result = {
            limit: vi.fn(async () => rows),
            orderBy: vi.fn(() => orderedResult),
            then: <TResult>(
              onFulfilled: (value: unknown[]) => TResult | PromiseLike<TResult>
            ) => Promise.resolve(rows).then(onFulfilled),
          };
          return {
            where: vi.fn(() => result),
            orderBy: vi.fn(() => orderedResult),
            innerJoin: vi.fn(() => ({ where: vi.fn(() => result) })),
          };
        }),
      })),
      insert: vi.fn(() => ({
        values: vi.fn((values: Record<string, unknown>) => {
          mocks.writes.push(values);
          return {
            $returningId: vi.fn(async () => [{ id: 701 }]),
            onDuplicateKeyUpdate: vi.fn(async () => undefined),
          };
        }),
      })),
      update: vi.fn(() => ({
        set: vi.fn((values: Record<string, unknown>) => {
          mocks.updates.push(values);
          return { where: vi.fn(async () => undefined) };
        }),
      })),
    };
    mocks.getDb.mockResolvedValue(db);
  });

  it("creates an owner-scoped draft with durable caller-provided ordering", async () => {
    mocks.selectResults = [[{ id: 8 }, { id: 13 }]];

    await expect(
      appRouter.createCaller(userContext()).olimp.contests.create({
        title: "Graph and combinatorics set",
        problemIds: [8, 13],
        durationMinutes: 180,
      })
    ).resolves.toEqual({ id: 701 });

    expect(mocks.writes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: 1,
          title: "Graph and combinatorics set",
          status: "draft",
          durationMinutes: 180,
        }),
        [
          expect.objectContaining({
            sessionId: 701,
            problemId: 8,
            position: 0,
          }),
          expect.objectContaining({
            sessionId: 701,
            problemId: 13,
            position: 1,
          }),
        ],
      ])
    );
  });

  it("returns deterministic owner-scoped contest suggestions while excluding terminal and active-contest problems", async () => {
    mocks.selectResults = [
      [
        { id: 1, difficulty: 800, title: "Solved" },
        { id: 2, difficulty: 1500, title: "Paused" },
        { id: 3, difficulty: 900, title: "Active contest" },
        { id: 4, difficulty: 1000, title: "Catalogue" },
      ],
      [
        { problemId: 1, status: "solved" },
        { problemId: 2, status: "paused" },
      ],
      [{ problemId: 3 }],
    ];

    await expect(
      appRouter.createCaller(userContext()).olimp.contests.suggest({ count: 4 })
    ).resolves.toMatchObject({
      calculationVersion: "contest-selection-v1",
      recommendations: [
        {
          problem: { id: 2, title: "Paused" },
          reasonCode: "unfinished_work",
        },
        {
          problem: { id: 4, title: "Catalogue" },
          reasonCode: "catalogue_fallback",
        },
      ],
    });
  });

  it("generates an editable AI draft only from protected eligible catalogue facts", async () => {
    mocks.selectResults = [
      [
        { id: 2, difficulty: 1500, title: "Paused graph", tags: ["graphs"] },
        { id: 4, difficulty: 1000, title: "Catalogue DP", tags: ["dp"] },
        { id: 5, difficulty: 1200, title: "Manual extra", tags: ["math"] },
      ],
      [{ problemId: 2, status: "paused" }],
      [],
    ];
    mocks.generateStructured.mockResolvedValue({
      model: "claude-haiku-4-5",
      content: JSON.stringify({
        title: "Focused graph and DP",
        durationMinutes: 120,
        problemIds: [2, 4],
        rationale:
          "Starts with unfinished graph work, followed by a lighter dynamic programming problem.",
      }),
    });

    await expect(
      appRouter.createCaller(userContext()).olimp.contests.aiDraft({ count: 2 })
    ).resolves.toEqual({
      proposal: {
        title: "Focused graph and DP",
        durationMinutes: 120,
        problemIds: [2, 4],
        rationale:
          "Starts with unfinished graph work, followed by a lighter dynamic programming problem.",
      },
    });

    const invocation = mocks.generateStructured.mock.calls[0]?.[0] as {
      messages: Array<{ content: string }>;
    };
    expect(invocation.messages[1]?.content).toContain("Paused graph");
    expect(invocation.messages[1]?.content).not.toContain("Private note");
    expect(invocation.messages[1]?.content).not.toContain("user-1");
  });

  it("rejects an AI draft that includes an ID outside the protected eligible set", async () => {
    mocks.selectResults = [
      [
        { id: 2, difficulty: 1500, title: "Paused graph", tags: ["graphs"] },
        { id: 4, difficulty: 1000, title: "Catalogue DP", tags: ["dp"] },
      ],
      [],
      [],
    ];
    mocks.generateStructured.mockResolvedValue({
      model: "claude-haiku-4-5",
      content: JSON.stringify({
        title: "Invalid selection",
        durationMinutes: 120,
        problemIds: [2, 999],
        rationale: "Invalid ID should not be accepted.",
      }),
    });

    await expect(
      appRouter.createCaller(userContext()).olimp.contests.aiDraft({ count: 2 })
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });

  it("rejects malformed structured-model JSON without exposing a parser failure", async () => {
    mocks.selectResults = [
      [
        { id: 2, difficulty: 1500, title: "Paused graph", tags: ["graphs"] },
        { id: 4, difficulty: 1000, title: "Catalogue DP", tags: ["dp"] },
      ],
      [],
      [],
    ];
    mocks.generateStructured.mockResolvedValue({
      model: "claude-haiku-4-5",
      content: "not-json",
    });

    await expect(
      appRouter.createCaller(userContext()).olimp.contests.aiDraft({ count: 2 })
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });

  it("starts only an owned draft and server-activates its first queued problem", async () => {
    mocks.selectResults = [
      [{ id: 7, userId: 1, status: "draft", durationMinutes: 120 }],
      [{ id: 12 }],
    ];

    await expect(
      appRouter
        .createCaller(userContext())
        .olimp.contests.start({ sessionId: 7 })
    ).resolves.toEqual({ success: true });

    expect(mocks.updates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: "active",
          startedAt: expect.any(Date),
        }),
        expect.objectContaining({ status: "active" }),
      ])
    );
    expect(mocks.writes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: 1,
          eventType: "contest_started",
          metadata: { sessionId: 7, itemId: 12, durationMinutes: 120 },
        }),
      ])
    );
  });

  it("promotes the next queued problem server-side after resolving the active problem", async () => {
    mocks.selectResults = [
      [{ id: 7, userId: 1, status: "active" }],
      [{ id: 12, sessionId: 7, problemId: 9, status: "active" }],
      [
        { id: 12, position: 0, status: "completed" },
        { id: 13, position: 1, status: "queued" },
      ],
    ];

    await expect(
      appRouter.createCaller(userContext()).olimp.contests.updateItem({
        sessionId: 7,
        itemId: 12,
        status: "completed",
      })
    ).resolves.toEqual({ success: true });

    expect(mocks.updates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: "completed",
          completedAt: expect.any(Date),
        }),
        expect.objectContaining({ status: "active" }),
      ])
    );
    expect(mocks.writes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: 1,
          problemId: 9,
          eventType: "contest_item_completed",
          metadata: { sessionId: 7, itemId: 12 },
        }),
      ])
    );
  });

  it("rejects resolving a queued item out of order before persisting a transition", async () => {
    mocks.selectResults = [
      [{ id: 7, userId: 1, status: "active" }],
      [{ id: 13, sessionId: 7, problemId: 10, status: "queued" }],
    ];

    await expect(
      appRouter.createCaller(userContext()).olimp.contests.updateItem({
        sessionId: 7,
        itemId: 13,
        status: "completed",
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(mocks.updates).toEqual([]);
    expect(mocks.writes).toEqual([]);
  });

  it("records a compact owner-scoped skipped-item fact without contest title or problem content", async () => {
    mocks.selectResults = [
      [{ id: 7, userId: 1, status: "active", title: "Private contest" }],
      [{ id: 12, sessionId: 7, problemId: 9, status: "active" }],
      [
        { id: 12, position: 0, status: "skipped" },
        { id: 13, position: 1, status: "queued" },
      ],
    ];

    await expect(
      appRouter.createCaller(userContext()).olimp.contests.updateItem({
        sessionId: 7,
        itemId: 12,
        status: "skipped",
      })
    ).resolves.toEqual({ success: true });

    expect(mocks.writes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: 1,
          problemId: 9,
          eventType: "contest_item_skipped",
          metadata: { sessionId: 7, itemId: 12 },
        }),
      ])
    );
    expect(JSON.stringify(mocks.writes)).not.toContain("Private contest");
    expect(JSON.stringify(mocks.writes)).not.toContain("problem content");
  });

  it("records only compact factual completion events when every item is terminal", async () => {
    mocks.selectResults = [
      [{ id: 7, userId: 1, status: "active" }],
      [{ id: 12, sessionId: 7, problemId: 9, status: "active" }],
      [{ id: 12, position: 0, status: "completed" }],
    ];

    await expect(
      appRouter.createCaller(userContext()).olimp.contests.updateItem({
        sessionId: 7,
        itemId: 12,
        status: "completed",
      })
    ).resolves.toEqual({ success: true });

    expect(mocks.writes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventType: "contest_item_completed" }),
        expect.objectContaining({
          userId: 1,
          eventType: "contest_completed",
          metadata: { sessionId: 7, itemCount: 1 },
        }),
      ])
    );
    expect(JSON.stringify(mocks.writes)).not.toContain("score");
    expect(JSON.stringify(mocks.writes)).not.toContain("penalty");
  });

  it("materializes a server-observed deadline as expired before rejecting further item resolution", async () => {
    mocks.selectResults = [
      [
        {
          id: 7,
          userId: 1,
          status: "active",
          durationMinutes: 60,
          expiresAt: new Date("2020-01-01T00:00:00.000Z"),
        },
      ],
    ];

    await expect(
      appRouter.createCaller(userContext()).olimp.contests.updateItem({
        sessionId: 7,
        itemId: 12,
        status: "completed",
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });

    expect(mocks.updates).toEqual(
      expect.arrayContaining([expect.objectContaining({ status: "expired" })])
    );
    expect(mocks.writes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: 1,
          eventType: "contest_expired",
          metadata: { sessionId: 7, durationMinutes: 60 },
        }),
      ])
    );
  });

  it("returns server-derived zero remaining time after materializing an expired detail view", async () => {
    mocks.selectResults = [
      [
        {
          id: 7,
          userId: 1,
          status: "active",
          durationMinutes: 60,
          expiresAt: new Date("2020-01-01T00:00:00.000Z"),
        },
      ],
      [],
    ];

    await expect(
      appRouter
        .createCaller(userContext())
        .olimp.contests.detail({ sessionId: 7 })
    ).resolves.toMatchObject({
      session: { id: 7, status: "expired" },
      timer: {
        durationMinutes: 60,
        remainingSeconds: 0,
        isExpired: true,
      },
    });
  });

  it("projects factual score and elapsed-time penalty through the protected contest detail contract", async () => {
    mocks.selectResults = [
      [
        {
          id: 7,
          userId: 1,
          status: "completed",
          durationMinutes: 120,
          startedAt: new Date("2026-08-15T09:00:00.000Z"),
          expiresAt: new Date("2026-08-15T11:00:00.000Z"),
        },
      ],
      [
        {
          item: {
            id: 12,
            status: "completed",
            completedAt: new Date("2026-08-15T09:07:01.000Z"),
          },
          problem: { id: 9, title: "Private title" },
        },
        {
          item: { id: 13, status: "skipped", completedAt: null },
          problem: { id: 10, title: "Another private title" },
        },
      ],
    ];

    await expect(
      appRouter
        .createCaller(userContext())
        .olimp.contests.detail({ sessionId: 7 })
    ).resolves.toMatchObject({
      scoring: {
        calculationVersion: "completion-time-v1",
        available: true,
        completedItems: 1,
        unscoredCompletedItems: 0,
        totalScore: 100,
        totalPenaltyMinutes: 8,
      },
    });
  });
});
