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
    user: { id: 31, openId: "user-31", role: "user", name: null },
    req: { headers: {}, protocol: "https" } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("protected AI user context", () => {
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

  it("returns only owner-scoped aggregate settings and status counts", async () => {
    mocks.selectResults = [
      [
        {
          timeZone: "Europe/Moscow",
          weeklyGoal: 6,
          activityTracking: "minimal",
        },
      ],
      [{ status: "solved", count: 3 }],
      [{ state: "active", count: 1 }],
      [{ status: "completed", count: 2 }],
      [{ status: "expired", count: 1 }],
    ];

    await expect(
      appRouter.createCaller(userContext()).olimp.ai.context()
    ).resolves.toEqual({
      contextVersion: "user-context-v1",
      preferences: {
        timeZone: "Europe/Moscow",
        weeklyGoal: 6,
        activityTracking: "minimal",
      },
      progressByStatus: { solved: 3 },
      attemptsByState: { active: 1 },
      trainingSessionsByStatus: { completed: 2 },
      contestSessionsByStatus: { expired: 1 },
      excludedData: [
        "free_form_notes",
        "source_code",
        "raw_activity_metadata",
        "external_handles",
        "session_credentials",
      ],
    });
  });

  it("uses documented schema defaults when an owner has no settings row", async () => {
    mocks.selectResults = [[], [], [], [], []];

    await expect(
      appRouter.createCaller(userContext()).olimp.ai.context()
    ).resolves.toMatchObject({
      preferences: {
        timeZone: "UTC",
        weeklyGoal: 4,
        activityTracking: "enabled",
      },
      progressByStatus: {},
      attemptsByState: {},
    });
  });
});
