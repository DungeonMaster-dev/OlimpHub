import { describe, expect, it } from "vitest";
import { activityRetentionCutoff, laterDate } from "./activityRetention";

describe("activity retention", () => {
  it("derives a deterministic UTC-neutral cutoff from the selected day retention", () => {
    const now = new Date("2026-08-15T12:00:00.000Z");
    expect(activityRetentionCutoff(30, now)).toEqual(
      new Date("2026-07-16T12:00:00.000Z")
    );
  });

  it("uses the stricter of an analytics window and the retention cutoff", () => {
    const early = new Date("2026-07-01T00:00:00.000Z");
    const late = new Date("2026-08-01T00:00:00.000Z");
    expect(laterDate(early, late)).toEqual(late);
    expect(laterDate(late, early)).toEqual(late);
  });
});
