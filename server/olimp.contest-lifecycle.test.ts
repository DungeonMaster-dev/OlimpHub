import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  selectResults: [] as unknown[][],
  updates: [] as Array<Record<string, unknown>>,
  writes: [] as Array<Record<string, unknown>>,
}));

vi.mock("./db", () => ({ getDb: mocks.getDb }));

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
      })
    ).resolves.toEqual({ id: 701 });

    expect(mocks.writes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: 1,
          title: "Graph and combinatorics set",
          status: "draft",
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

  it("starts only an owned draft and server-activates its first queued problem", async () => {
    mocks.selectResults = [
      [{ id: 7, userId: 1, status: "draft" }],
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
          metadata: { sessionId: 7, itemId: 12 },
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
});
