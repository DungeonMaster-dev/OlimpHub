import { describe, expect, it } from "vitest";
import { buildActivityStreak } from "./activityStreak";

describe("activity streak", () => {
  it("counts a UTC active-day streak through today when today has persisted activity", () => {
    expect(
      buildActivityStreak(
        ["2026-08-10", "2026-08-11", "2026-08-12"],
        new Date("2026-08-12T14:00:00.000Z")
      )
    ).toEqual({
      currentDays: 3,
      activeToday: true,
      lastActiveDate: "2026-08-12",
    });
  });

  it("continues through yesterday before today's first event and resets after a gap", () => {
    expect(
      buildActivityStreak(
        ["2026-08-08", "2026-08-10", "2026-08-11"],
        new Date("2026-08-12T14:00:00.000Z")
      )
    ).toEqual({
      currentDays: 2,
      activeToday: false,
      lastActiveDate: "2026-08-11",
    });
    expect(
      buildActivityStreak(["2026-08-10"], new Date("2026-08-12T14:00:00.000Z"))
    ).toEqual({
      currentDays: 0,
      activeToday: false,
      lastActiveDate: "2026-08-10",
    });
  });
});
