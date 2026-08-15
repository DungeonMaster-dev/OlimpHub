import { describe, expect, it } from "vitest";
import { buildStructuredUserContext } from "./userContext";

describe("structured AI user context", () => {
  it("returns only normalized owner-scoped aggregate evidence with declared exclusions", () => {
    const context = buildStructuredUserContext({
      preferences: {
        timeZone: "Europe/Moscow",
        weeklyGoal: 6,
        activityTracking: "minimal",
      },
      progress: [
        { status: "solved", count: "3" },
        { status: "paused", count: 2 },
      ],
      attempts: [{ status: "active", count: "1" }],
      trainingSessions: [{ status: "completed", count: 4 }],
      contestSessions: [{ status: "expired", count: 1 }],
    });

    expect(context).toEqual({
      contextVersion: "user-context-v1",
      preferences: {
        timeZone: "Europe/Moscow",
        weeklyGoal: 6,
        activityTracking: "minimal",
      },
      progressByStatus: { paused: 2, solved: 3 },
      attemptsByState: { active: 1 },
      trainingSessionsByStatus: { completed: 4 },
      contestSessionsByStatus: { expired: 1 },
      excludedData: [
        "free_form_notes",
        "source_code",
        "raw_activity_metadata",
        "external_handles",
        "session_credentials",
      ],
    });
    expect(JSON.stringify(context)).not.toContain("Private note");
    expect(JSON.stringify(context)).not.toContain("sourceUrl");
  });
});
