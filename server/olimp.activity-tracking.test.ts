import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  limitedResults: [] as unknown[][],
  writes: [] as Array<Record<string, unknown>>,
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

describe("workspace page activity tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.writes = [];
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(async () => mocks.limitedResults.shift() ?? []),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        values: vi.fn((values: Record<string, unknown>) => {
          const duplicatePageView = mocks.writes.some(
            write =>
              write.eventType === "problem_page_viewed" &&
              write.clientEventId === values.clientEventId
          );
          if (!duplicatePageView) mocks.writes.push(values);
          return { onDuplicateKeyUpdate: vi.fn(async () => undefined) };
        }),
      })),
    };
    mocks.getDb.mockResolvedValue(db);
  });

  it("records one minimal owner-scoped workspace page-view fact in detailed mode", async () => {
    mocks.limitedResults = [
      [{ id: 1, userId: 1, activityTracking: "enabled" }],
      [{ id: 9 }],
    ];

    await expect(
      appRouter.createCaller(userContext()).olimp.workspace.recordPageActivity({
        problemId: 9,
        clientEventId: "a39a5741-403c-455a-8897-5be3aa3ab33b",
      })
    ).resolves.toEqual({ recorded: true, reason: null });
    expect(mocks.writes).toContainEqual(
      expect.objectContaining({
        userId: 1,
        problemId: 9,
        eventType: "problem_page_viewed",
        metadata: { surface: "workspace" },
      })
    );
  });

  it("does not record page views when the user selects minimal tracking", async () => {
    mocks.limitedResults = [
      [{ id: 1, userId: 1, activityTracking: "minimal" }],
    ];

    await expect(
      appRouter.createCaller(userContext()).olimp.workspace.recordPageActivity({
        problemId: 9,
        clientEventId: "a39a5741-403c-455a-8897-5be3aa3ab33b",
      })
    ).resolves.toEqual({ recorded: false, reason: "minimal_tracking" });
    expect(
      mocks.writes.filter(write => write.eventType === "problem_page_viewed")
    ).toHaveLength(0);
  });

  it("records editor phase without accepting or persisting private note text", async () => {
    mocks.limitedResults = [
      [{ id: 1, userId: 1, activityTracking: "enabled" }],
      [{ id: 9 }],
    ];

    await expect(
      appRouter
        .createCaller(userContext())
        .olimp.workspace.recordEditorActivity({
          problemId: 9,
          phase: "focused",
          clientEventId: "a39a5741-403c-455a-8897-5be3aa3ab33b",
        })
    ).resolves.toEqual({ recorded: true, reason: null });
    expect(mocks.writes).toContainEqual(
      expect.objectContaining({
        userId: 1,
        problemId: 9,
        eventType: "note_editor_focused",
        metadata: { surface: "workspace_note" },
      })
    );
    expect(JSON.stringify(mocks.writes)).not.toContain("private note");
  });

  it("deduplicates the same client page-view event and records a new revisit", async () => {
    mocks.limitedResults = [
      [{ id: 1, userId: 1, activityTracking: "enabled" }],
      [{ id: 9 }],
      [{ id: 1, userId: 1, activityTracking: "enabled" }],
      [{ id: 9 }],
      [{ id: 1, userId: 1, activityTracking: "enabled" }],
      [{ id: 9 }],
    ];
    const caller = appRouter.createCaller(userContext());
    const firstVisit = {
      problemId: 9,
      clientEventId: "a39a5741-403c-455a-8897-5be3aa3ab33b",
    };

    await caller.olimp.workspace.recordPageActivity(firstVisit);
    await caller.olimp.workspace.recordPageActivity(firstVisit);
    await caller.olimp.workspace.recordPageActivity({
      problemId: 9,
      clientEventId: "bb1bafcf-b48a-42b1-b9c6-563337da2b59",
    });

    expect(
      mocks.writes.filter(write => write.eventType === "problem_page_viewed")
    ).toEqual([
      expect.objectContaining({ clientEventId: firstVisit.clientEventId }),
      expect.objectContaining({
        clientEventId: "bb1bafcf-b48a-42b1-b9c6-563337da2b59",
      }),
    ]);
  });
});
