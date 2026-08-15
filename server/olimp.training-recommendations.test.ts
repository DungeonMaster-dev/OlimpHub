import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  selectResults: [] as unknown[][],
}));

vi.mock("./db", () => ({ getDb: mocks.getDb }));

import { appRouter } from "./routers";

function ownerContext(): TrpcContext {
  return {
    user: { id: 91, openId: "owner-91", role: "user", name: null },
    req: { headers: {}, protocol: "https" } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("protected training recommendation plan", () => {
  beforeEach(() => {
    mocks.selectResults = [];
    mocks.getDb.mockResolvedValue({
      select: vi.fn(() => ({
        from: vi.fn(() => {
          const rows = mocks.selectResults.shift() ?? [];
          const result = {
            orderBy: vi.fn(() => ({ limit: vi.fn(async () => rows) })),
            then: <TResult>(
              onFulfilled: (value: unknown[]) => TResult | PromiseLike<TResult>
            ) => Promise.resolve(rows).then(onFulfilled),
          };
          return {
            orderBy: vi.fn(() => ({ limit: vi.fn(async () => rows) })),
            where: vi.fn(() => result),
            innerJoin: vi.fn(() => ({ where: vi.fn(() => result) })),
          };
        }),
      })),
    });
  });

  it("returns a dedicated editable plan only from real owner-scoped evidence", async () => {
    mocks.selectResults = [
      [
        { id: 2, title: "Paused", difficulty: 1300, tags: [] },
        { id: 3, title: "Held", difficulty: 1400, tags: [] },
      ],
      [{ problemId: 2, status: "paused" }],
      [{ problemId: 3 }],
      [],
      [{ difficulty: 1200 }, { difficulty: 1400 }, { difficulty: 1000 }],
      [
        {
          startedAt: new Date("2026-08-01T10:00:00Z"),
          endedAt: new Date("2026-08-01T10:10:00Z"),
        },
        {
          startedAt: new Date("2026-08-02T10:00:00Z"),
          endedAt: new Date("2026-08-02T10:20:00Z"),
        },
        {
          startedAt: new Date("2026-08-03T10:00:00Z"),
          endedAt: new Date("2026-08-03T10:30:00Z"),
        },
      ],
    ];

    await expect(
      appRouter
        .createCaller(ownerContext())
        .olimp.ai.trainingRecommendations({ count: 4 })
    ).resolves.toMatchObject({
      calculationVersion: "training-recommendations-v1",
      status: "ready",
      problemRecommendationStatus: "ready",
      creationHandoff: {
        title: "Recommended practice",
        problemIds: [2],
      },
      expectedDuration: {
        status: "estimated",
        expectedMinutes: 20,
        lowerMinutes: 14,
        upperMinutes: 26,
      },
      recommendations: [
        {
          problem: { id: 2, title: "Paused" },
          reasonCode: "unfinished_progress",
        },
      ],
    });
  });
});
