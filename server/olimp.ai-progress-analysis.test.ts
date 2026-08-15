import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  selectResults: [] as unknown[][],
}));

vi.mock("./db", () => ({ getDb: mocks.getDb }));

import { appRouter } from "./routers";

function userContext(): TrpcContext {
  return {
    user: { id: 52, openId: "user-52", role: "user", name: null },
    req: { headers: {}, protocol: "https" } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("protected AI factual progress analysis", () => {
  beforeEach(() => {
    mocks.selectResults = [];
    mocks.getDb.mockResolvedValue({
      select: vi.fn(() => ({
        from: vi.fn(() => {
          const rows = mocks.selectResults.shift() ?? [];
          const result = {
            limit: vi.fn(async () => rows),
            groupBy: vi.fn(async () => rows),
          };
          return { where: vi.fn(() => result) };
        }),
      })),
    });
  });

  it("uses owner-scoped aggregate rows and returns an explainable count snapshot", async () => {
    mocks.selectResults = [
      [{ timeZone: "UTC", weeklyGoal: 4, activityTracking: "enabled" }],
      [
        { status: "solved", count: 3 },
        { status: "in_progress", count: 2 },
      ],
      [{ state: "active", count: 1 }],
      [{ status: "completed", count: 2 }],
      [{ status: "completed", count: 1 }],
    ];

    await expect(
      appRouter.createCaller(userContext()).olimp.ai.progressAnalysis()
    ).resolves.toMatchObject({
      calculationVersion: "progress-analysis-v1",
      contextVersion: "user-context-v1",
      status: "available",
      evidence: {
        progressRecords: 5,
        attempts: 1,
        trainingSessions: 2,
        contestSessions: 1,
      },
      observations: expect.arrayContaining([
        expect.objectContaining({ code: "solved_progress", count: 3 }),
        expect.objectContaining({ code: "open_progress", count: 2 }),
      ]),
    });
  });

  it("does not treat an empty aggregate context as a negative outcome", async () => {
    mocks.selectResults = [[], [], [], [], []];

    await expect(
      appRouter.createCaller(userContext()).olimp.ai.progressAnalysis()
    ).resolves.toMatchObject({
      status: "insufficient_evidence",
      evidence: {
        progressRecords: 0,
        attempts: 0,
        trainingSessions: 0,
        contestSessions: 0,
      },
    });
  });
});
