import { describe, expect, it } from "vitest";
import {
  buildActivityStatistics,
  earliestActivityStatisticsStart,
} from "./activityStatistics";

describe("activity statistics", () => {
  it("uses UTC calendar day, week and month windows with only persisted factual events", () => {
    const now = new Date("2026-08-12T14:00:00.000Z");
    const statistics = buildActivityStatistics(
      [
        {
          occurredAt: new Date("2026-08-12T10:00:00.000Z"),
          eventType: "note_editor_active",
          metadata: { intervalSeconds: 60 },
        },
        {
          occurredAt: new Date("2026-08-11T10:00:00.000Z"),
          eventType: "problem_status_changed",
          metadata: { status: "solved" },
        },
        {
          occurredAt: new Date("2026-08-03T10:00:00.000Z"),
          eventType: "problem_page_viewed",
          metadata: { surface: "workspace" },
        },
        {
          occurredAt: new Date("2026-07-31T10:00:00.000Z"),
          eventType: "note_editor_active",
          metadata: { intervalSeconds: 60 },
        },
      ],
      now
    );

    expect(statistics.day).toMatchObject({
      eventCount: 1,
      activeMinutes: 1,
      solvedUpdates: 0,
    });
    expect(statistics.week).toMatchObject({
      eventCount: 2,
      activeMinutes: 1,
      solvedUpdates: 1,
    });
    expect(statistics.month).toMatchObject({
      eventCount: 3,
      activeMinutes: 1,
      solvedUpdates: 1,
    });
    expect(earliestActivityStatisticsStart(now)).toEqual(
      new Date("2026-08-01T00:00:00.000Z")
    );
  });
});
