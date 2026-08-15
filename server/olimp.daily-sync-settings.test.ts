import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  createHeartbeatJob: vi.fn(),
  getDb: vi.fn(),
  link: null as Record<string, unknown> | null,
  updateHeartbeatJob: vi.fn(),
  updates: [] as Array<Record<string, unknown>>,
}));

vi.mock("./db", () => ({ getDb: mocks.getDb }));
vi.mock("./_core/heartbeat", () => ({
  createHeartbeatJob: mocks.createHeartbeatJob,
  updateHeartbeatJob: mocks.updateHeartbeatJob,
}));

import { appRouter } from "./routers";

function userContext(): TrpcContext {
  return {
    user: { id: 1, openId: "user-1", role: "user", name: null },
    req: { headers: {}, protocol: "https" } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("daily Codeforces sync settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updates = [];
    mocks.getDb.mockResolvedValue({
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(async () => (mocks.link ? [mocks.link] : [])),
          })),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn((values: Record<string, unknown>) => {
          mocks.updates.push(values);
          return { where: vi.fn(async () => undefined) };
        }),
      })),
    });
  });

  it("creates a task-UID-bound daily job before enabling a link", async () => {
    mocks.link = { id: 7, userId: 1, scheduleCronTaskUid: null };
    mocks.createHeartbeatJob.mockResolvedValue({
      taskUid: "task-7",
      nextExecutionAt: "2026-08-16T03:00:00.000Z",
    });

    await expect(
      appRouter
        .createCaller(userContext())
        .olimp.settings.setDailyCodeforcesProfileSync({ enabled: true })
    ).resolves.toMatchObject({ enabled: true });
    expect(mocks.createHeartbeatJob).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "codeforces-daily-profile-7",
        cron: "0 0 3 * * *",
        path: "/api/scheduled/codeforces-profile-sync",
      }),
      ""
    );
    expect(mocks.updates).toContainEqual({
      dailySyncEnabled: "enabled",
      scheduleCronTaskUid: "task-7",
    });
  });

  it("pauses an existing task UID without replacing it", async () => {
    mocks.link = { id: 7, userId: 1, scheduleCronTaskUid: "task-7" };
    mocks.updateHeartbeatJob.mockResolvedValue({ nextExecutionAt: null });

    await expect(
      appRouter
        .createCaller(userContext())
        .olimp.settings.setDailyCodeforcesProfileSync({ enabled: false })
    ).resolves.toEqual({ enabled: false, nextExecutionAt: null });
    expect(mocks.updateHeartbeatJob).toHaveBeenCalledWith(
      "task-7",
      { enable: false },
      ""
    );
    expect(mocks.updates).toContainEqual({ dailySyncEnabled: "disabled" });
  });
});
