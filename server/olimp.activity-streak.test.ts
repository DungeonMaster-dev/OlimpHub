import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  activeDates: [] as Array<{ date: string }>,
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

function utcDay(value: Date) {
  return value.toISOString().slice(0, 10);
}

describe("analytics.activityStreak", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.activeDates = [];
    mocks.getDb.mockResolvedValue({
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          onDuplicateKeyUpdate: vi.fn(async () => undefined),
        })),
      })),
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(async () => [
              { id: 1, userId: 1, analyticsRetentionDays: 90 },
            ]),
            groupBy: vi.fn(() => ({
              orderBy: vi.fn(async () => mocks.activeDates),
            })),
          })),
        })),
      })),
    });
  });

  it("returns an owner-scoped current streak from distinct persisted UTC activity dates", async () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2);
    mocks.activeDates = [
      { date: utcDay(twoDaysAgo) },
      { date: utcDay(yesterday) },
      { date: utcDay(now) },
    ];

    const result = await appRouter
      .createCaller(userContext())
      .olimp.analytics.activityStreak();

    expect(result.periodBasis).toBe("utc_calendar");
    expect(result.streak).toEqual({
      currentDays: 3,
      activeToday: true,
      lastActiveDate: utcDay(now),
    });
  });
});
