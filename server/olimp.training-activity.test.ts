import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  selectResults: [] as unknown[][],
  updates: [] as Array<Record<string, unknown>>,
  writes: [] as Array<Record<string, unknown>>,
}));

vi.mock("./db", () => ({ getDb: mocks.getDb }));
vi.mock("node:crypto", async importOriginal => {
  const actual = await importOriginal<typeof import("node:crypto")>();
  return { ...actual, randomUUID: () => "receipt-owner" };
});

import { appRouter } from "./routers";

function userContext(): TrpcContext {
  return {
    user: { id: 1, openId: "user-1", role: "user", name: null },
    req: { headers: {}, protocol: "https" } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("training session activity tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.selectResults = [];
    mocks.updates = [];
    mocks.writes = [];
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => {
          const rows = mocks.selectResults.shift() ?? [];
          const result = {
            limit: vi.fn(async () => rows),
            orderBy: vi.fn(async () => rows),
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

  it("records factual item/session completion without retaining a training title or problem content", async () => {
    mocks.selectResults = [
      [{ id: 7, userId: 1, status: "active" }],
      [{ id: 12, sessionId: 7, problemId: 9, status: "active" }],
      [{ status: "completed" }, { status: "skipped" }],
    ];

    await expect(
      appRouter.createCaller(userContext()).olimp.training.updateItem({
        sessionId: 7,
        itemId: 12,
        status: "completed",
      })
    ).resolves.toEqual({ success: true });

    expect(mocks.writes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: 1,
          problemId: 9,
          eventType: "training_item_completed",
          metadata: { sessionId: 7, itemId: 12 },
        }),
        expect.objectContaining({
          userId: 1,
          eventType: "training_completed",
          metadata: { sessionId: 7, itemCount: 2 },
        }),
      ])
    );
    expect(mocks.updates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: "completed" }),
        expect.objectContaining({
          status: "completed",
          completedAt: expect.any(Date),
        }),
      ])
    );
    expect(JSON.stringify(mocks.writes)).not.toContain("Private session title");
    expect(JSON.stringify(mocks.writes)).not.toContain(
      "private problem content"
    );
  });

  it("promotes the next queued item server-side when the active item reaches a terminal state", async () => {
    mocks.selectResults = [
      [{ id: 7, userId: 1, status: "active" }],
      [{ id: 12, sessionId: 7, problemId: 9, status: "active" }],
      [
        { id: 12, position: 0, status: "completed" },
        { id: 13, position: 1, status: "queued" },
      ],
    ];

    await expect(
      appRouter.createCaller(userContext()).olimp.training.updateItem({
        sessionId: 7,
        itemId: 12,
        status: "completed",
      })
    ).resolves.toEqual({ success: true });

    expect(mocks.updates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: "completed" }),
        expect.objectContaining({ status: "active" }),
      ])
    );
    expect(mocks.writes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: 1,
          eventType: "training_item_active",
          metadata: { sessionId: 7, itemId: 13 },
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
      appRouter.createCaller(userContext()).olimp.training.updateItem({
        sessionId: 7,
        itemId: 13,
        status: "completed",
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(mocks.updates).toEqual([]);
    expect(mocks.writes).toEqual([]);
  });

  it("rejects client-driven queued-to-active promotion so a session cannot gain multiple active items", async () => {
    mocks.selectResults = [
      [{ id: 7, userId: 1, status: "active" }],
      [{ id: 13, sessionId: 7, problemId: 10, status: "queued" }],
    ];

    await expect(
      appRouter.createCaller(userContext()).olimp.training.updateItem({
        sessionId: 7,
        itemId: 13,
        status: "active",
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(mocks.updates).toEqual([]);
    expect(mocks.writes).toEqual([]);
  });

  it("persists an ordered manual session once and replays an identical request without duplicating it", async () => {
    mocks.selectResults = [
      [
        {
          ownerToken: "receipt-owner",
          status: "pending",
          response: null,
        },
      ],
      [{ id: 8 }, { id: 13 }],
      [
        {
          ownerToken: "previous-request-owner",
          status: "completed",
          response: { id: 701 },
        },
      ],
    ];

    const caller = appRouter.createCaller(userContext());
    const input = {
      title: "Two-problem graph review",
      problemIds: [8, 13],
      requestId: "e2661a3e-ef4d-4f8a-9fcd-3dc54ab73e04",
    };

    await expect(caller.olimp.training.create(input)).resolves.toEqual({
      id: 701,
    });
    await expect(caller.olimp.training.create(input)).resolves.toEqual({
      id: 701,
    });

    expect(mocks.writes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: 1,
          title: "Two-problem graph review",
          status: "active",
        }),
        [
          expect.objectContaining({
            sessionId: 701,
            problemId: 8,
            position: 0,
            status: "active",
          }),
          expect.objectContaining({
            sessionId: 701,
            problemId: 13,
            position: 1,
            status: "queued",
          }),
        ],
        expect.objectContaining({
          userId: 1,
          eventType: "training_started",
          metadata: { sessionId: 701, problemCount: 2 },
        }),
      ])
    );
    expect(
      mocks.writes.filter(
        entry =>
          !Array.isArray(entry) && entry.title === "Two-problem graph review"
      )
    ).toHaveLength(1);
  });

  it("rejects an unavailable manual selection before creating a session", async () => {
    mocks.selectResults = [
      [
        {
          ownerToken: "receipt-owner",
          status: "pending",
          response: null,
        },
      ],
      [{ id: 8 }],
    ];

    await expect(
      appRouter.createCaller(userContext()).olimp.training.create({
        title: "Unavailable selection",
        problemIds: [8, 13],
        requestId: "d2e3e36d-60b9-41ff-8c42-5afdd1b9dca1",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(
      mocks.writes.filter(
        entry =>
          !Array.isArray(entry) && entry.title === "Unavailable selection"
      )
    ).toHaveLength(0);
  });

  it("returns the created owner session with its persisted active/queued sequence", async () => {
    mocks.selectResults = [
      [{ id: 8 }, { id: 13 }],
      [
        {
          id: 701,
          userId: 1,
          title: "Graph foundations",
          status: "active",
        },
      ],
      [
        {
          item: {
            id: 900,
            sessionId: 701,
            problemId: 8,
            position: 0,
            status: "active",
          },
          problem: { id: 8, title: "Two Sum" },
        },
        {
          item: {
            id: 901,
            sessionId: 701,
            problemId: 13,
            position: 1,
            status: "queued",
          },
          problem: { id: 13, title: "Graph traversal" },
        },
      ],
    ];

    const caller = appRouter.createCaller(userContext());
    await expect(
      caller.olimp.training.create({
        title: "Graph foundations",
        problemIds: [8, 13],
      })
    ).resolves.toEqual({ id: 701 });

    await expect(
      caller.olimp.training.detail({ sessionId: 701 })
    ).resolves.toMatchObject({
      session: {
        id: 701,
        userId: 1,
        title: "Graph foundations",
        status: "active",
      },
      items: [
        { item: { id: 900, problemId: 8, position: 0, status: "active" } },
        { item: { id: 901, problemId: 13, position: 1, status: "queued" } },
      ],
    });
  });
});
