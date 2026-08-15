import { describe, expect, it } from "vitest";
import { buildDailyProgressTimeline } from "./timeline";

describe("progress timeline", () => {
  it("fills the selected dates and counts only persisted solved-status updates", () => {
    const timeline = buildDailyProgressTimeline({
      startsAt: new Date("2026-08-01T00:00:00.000Z"),
      endsAt: new Date("2026-08-03T23:59:59.999Z"),
      events: [
        {
          occurredAt: new Date("2026-08-01T12:00:00.000Z"),
          eventType: "note_saved",
          metadata: {},
        },
        {
          occurredAt: new Date("2026-08-03T12:00:00.000Z"),
          eventType: "problem_status_changed",
          metadata: { status: "solved" },
        },
      ],
    });
    expect(timeline).toEqual([
      { date: "2026-08-01", activityCount: 1, solvedUpdates: 0 },
      { date: "2026-08-02", activityCount: 0, solvedUpdates: 0 },
      { date: "2026-08-03", activityCount: 1, solvedUpdates: 1 },
    ]);
  });
});
