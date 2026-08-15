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

describe("training session activity tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.selectResults = [];
    mocks.updates = [];
    mocks.writes = [];
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => {
            const rows = mocks.selectResults.shift() ?? [];
            return {
              limit: vi.fn(async () => rows),
              then: <TResult>(
                onFulfilled: (
                  value: unknown[]
                ) => TResult | PromiseLike<TResult>
              ) => Promise.resolve(rows).then(onFulfilled),
            };
          }),
        })),
      })),
      insert: vi.fn(() => ({
        values: vi.fn((values: Record<string, unknown>) => {
          mocks.writes.push(values);
          return { onDuplicateKeyUpdate: vi.fn(async () => undefined) };
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
});
