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
    user: { id: 1, openId: "owner-1", role: "user", name: null },
    req: { headers: {}, protocol: "https" } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function anonymousContext(): TrpcContext {
  return { ...ownerContext(), user: null };
}

describe("adaptive training recommendations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => {
          const rows = mocks.selectResults.shift() ?? [];
          return {
            orderBy: vi.fn(() => ({ limit: vi.fn(async () => rows) })),
            where: vi.fn(async () => rows),
            innerJoin: vi.fn(() => ({ where: vi.fn(async () => rows) })),
          };
        }),
      })),
    };
    mocks.getDb.mockResolvedValue(db);
  });

  it("ranks only unfinished owner candidates and omits items already held by an active session", async () => {
    mocks.selectResults = [
      [
        { id: 1, title: "Solved", difficulty: 800 },
        { id: 2, title: "Paused", difficulty: 1600 },
        { id: 3, title: "Planned", difficulty: 1100 },
        { id: 4, title: "Already selected", difficulty: 700 },
      ],
      [
        { problemId: 1, status: "solved" },
        { problemId: 2, status: "paused" },
        { problemId: 3, status: "planned" },
      ],
      [{ problemId: 4 }],
    ];

    await expect(
      appRouter
        .createCaller(ownerContext())
        .olimp.training.adaptive({ count: 4 })
    ).resolves.toMatchObject({
      calculationVersion: "adaptive-training-v1",
      recommendations: [
        {
          problem: { id: 2, title: "Paused" },
          reasonCode: "recent_attempt",
        },
        {
          problem: { id: 3, title: "Planned" },
          reasonCode: "goal_alignment",
        },
      ],
    });
  });

  it("rejects anonymous adaptive-selection reads before accessing candidate data", async () => {
    await expect(
      appRouter
        .createCaller(anonymousContext())
        .olimp.training.adaptive({ count: 4 })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(mocks.getDb).not.toHaveBeenCalled();
  });
});
