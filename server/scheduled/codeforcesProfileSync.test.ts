import { describe, expect, it, vi } from "vitest";
import { createDailyCodeforcesProfileSyncHandler } from "./codeforcesProfileSync";

function response() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
}

describe("daily Codeforces profile sync callback", () => {
  it("rejects non-cron callers before invoking profile work", async () => {
    const run = vi.fn();
    const handler = createDailyCodeforcesProfileSyncHandler({
      authenticateRequest: async () => ({ id: 1 }) as never,
      run,
    });
    const res = response();

    await handler(
      { path: "/api/scheduled/codeforces-profile-sync" } as never,
      res as never,
      vi.fn()
    );

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "cron_only" });
    expect(run).not.toHaveBeenCalled();
  });

  it("runs only for the authenticated task UID and returns its result", async () => {
    const run = vi.fn().mockResolvedValue({
      ok: true,
      linkId: 7,
      submissionsImported: 3,
      ratingChangesImported: 1,
    });
    const handler = createDailyCodeforcesProfileSyncHandler({
      authenticateRequest: async () =>
        ({
          id: -1,
          isCron: true,
          taskUid: "task-7",
        }) as never,
      run,
    });
    const req = { path: "/api/scheduled/codeforces-profile-sync" };
    const res = response();

    await handler(req as never, res as never, vi.fn());

    expect(run).toHaveBeenCalledWith(
      expect.objectContaining({ taskUid: "task-7" })
    );
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      linkId: 7,
      submissionsImported: 3,
      ratingChangesImported: 1,
    });
  });

  it("returns a retryable 500 diagnostic when profile work fails", async () => {
    const handler = createDailyCodeforcesProfileSyncHandler({
      authenticateRequest: async () =>
        ({
          id: -1,
          isCron: true,
          taskUid: "task-7",
        }) as never,
      run: vi
        .fn()
        .mockRejectedValue(new Error("upstream temporarily unavailable")),
    });
    const res = response();

    await handler(
      { path: "/api/scheduled/codeforces-profile-sync" } as never,
      res as never,
      vi.fn()
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "daily_codeforces_profile_sync_failed",
        context: expect.objectContaining({ taskUid: "task-7" }),
      })
    );
  });
});
