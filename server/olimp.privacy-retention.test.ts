import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  updates: [] as Array<Record<string, unknown>>,
  deletes: 0,
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

describe("settings privacy retention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updates = [];
    mocks.deletes = 0;
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
          })),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn((values: Record<string, unknown>) => {
          mocks.updates.push(values);
          return { where: vi.fn(async () => undefined) };
        }),
      })),
      delete: vi.fn(() => ({
        where: vi.fn(async () => {
          mocks.deletes += 1;
        }),
      })),
    });
  });

  it("persists owner-selected retention and purges events outside the selected window", async () => {
    await expect(
      appRouter.createCaller(userContext()).olimp.settings.update({
        timeZone: "UTC",
        weeklyGoal: 4,
        activityTracking: "enabled",
        notificationOptIn: "disabled",
        analyticsPeriodDays: 30,
        analyticsRetentionDays: 30,
      })
    ).resolves.toEqual({ success: true });

    expect(mocks.updates).toContainEqual(
      expect.objectContaining({ analyticsRetentionDays: 30 })
    );
    expect(mocks.deletes).toBe(1);
  });

  it("requires an exact confirmation and then deletes only the current owner's activity history", async () => {
    const caller = appRouter.createCaller(userContext());
    await expect(
      caller.olimp.settings.purgeActivityHistory({
        // @ts-expect-error verifies runtime input validation for destructive mutation.
        confirmation: "delete",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller.olimp.settings.purgeActivityHistory({
        confirmation: "DELETE_ACTIVITY_HISTORY",
      })
    ).resolves.toEqual({ success: true });
    expect(mocks.deletes).toBe(1);
  });
});
