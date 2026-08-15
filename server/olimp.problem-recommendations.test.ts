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
    user: { id: 81, openId: "owner-81", role: "user", name: null },
    req: { headers: {}, protocol: "https" } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("protected dedicated problem recommendations", () => {
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

  it("selects eligible real catalogue problems with owner-scoped progress and session exclusions", async () => {
    mocks.selectResults = [
      [
        { id: 1, title: "Solved", difficulty: 800, tags: [] },
        { id: 2, title: "Paused", difficulty: 1500, tags: [] },
        { id: 3, title: "Planned", difficulty: 1300, tags: [] },
        { id: 4, title: "Training held", difficulty: 1300, tags: [] },
        { id: 5, title: "Contest held", difficulty: 1300, tags: [] },
      ],
      [
        { problemId: 1, status: "solved" },
        { problemId: 2, status: "paused" },
        { problemId: 3, status: "planned" },
      ],
      [{ problemId: 4 }],
      [{ problemId: 5 }],
      [{ difficulty: 1200 }, { difficulty: 1400 }, { difficulty: 1000 }],
    ];

    await expect(
      appRouter
        .createCaller(ownerContext())
        .olimp.ai.problemRecommendations({ count: 4 })
    ).resolves.toMatchObject({
      calculationVersion: "problem-recommendations-v1",
      status: "ready",
      progression: { status: "estimated", targetDifficulty: 1300 },
      recommendations: [
        {
          problem: { id: 2, title: "Paused" },
          reasonCode: "unfinished_progress",
        },
        {
          problem: { id: 3, title: "Planned" },
          reasonCode: "planned_practice",
        },
      ],
    });
  });

  it("returns a visible insufficient-catalogue contract when no real candidates exist", async () => {
    mocks.selectResults = [[]];

    await expect(
      appRouter
        .createCaller(ownerContext())
        .olimp.ai.problemRecommendations({ count: 4 })
    ).resolves.toMatchObject({
      status: "insufficient_catalogue",
      recommendations: [],
    });
  });
});
