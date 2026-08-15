import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  events: [] as Array<Record<string, unknown>>,
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

describe("analytics.activityStatistics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.events = [];
    mocks.getDb.mockResolvedValue({
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(async () => mocks.events),
          })),
        })),
      })),
    });
  });

  it("returns calendar statistics derived from factual owner-scoped activity rows", async () => {
    const now = Date.now();
    mocks.events = [
      {
        userId: 1,
        occurredAt: new Date(now - 60_000),
        eventType: "note_editor_active",
        metadata: { surface: "workspace_note", intervalSeconds: 60 },
      },
      {
        userId: 1,
        occurredAt: new Date(now - 120_000),
        eventType: "problem_status_changed",
        metadata: { status: "solved" },
      },
      {
        userId: 1,
        occurredAt: new Date(now - 180_000),
        eventType: "problem_page_viewed",
        metadata: { surface: "workspace" },
      },
    ];

    const result = await appRouter
      .createCaller(userContext())
      .olimp.analytics.activityStatistics();

    expect(result.periodBasis).toBe("utc_calendar");
    expect(result.statistics.day).toMatchObject({
      eventCount: 3,
      activeMinutes: 1,
      solvedUpdates: 1,
    });
    expect(result.statistics.week).toMatchObject({
      eventCount: 3,
      activeMinutes: 1,
      solvedUpdates: 1,
    });
    expect(result.statistics.month).toMatchObject({
      eventCount: 3,
      activeMinutes: 1,
      solvedUpdates: 1,
    });
  });
});
