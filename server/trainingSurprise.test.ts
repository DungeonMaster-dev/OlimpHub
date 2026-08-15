import { describe, expect, it } from "vitest";
import { selectDailySurpriseProblemIds } from "../shared/trainingSurprise";

describe("daily Surprise Me selection", () => {
  it("selects a stable bounded unique subset for the same UTC day", () => {
    expect(
      selectDailySurpriseProblemIds([8, 13, 21, 34, 55, 8], "2026-08-15", 4)
    ).toEqual(
      selectDailySurpriseProblemIds([8, 13, 21, 34, 55], "2026-08-15", 4)
    );
    expect(
      selectDailySurpriseProblemIds([8, 13, 21, 34, 55], "2026-08-15", 4)
    ).toHaveLength(4);
  });

  it("validates the UTC day and bounded session size", () => {
    expect(() => selectDailySurpriseProblemIds([1], "today")).toThrow(
      "Daily surprise selection requires a UTC day key."
    );
    expect(() => selectDailySurpriseProblemIds([1], "2026-08-15", 0)).toThrow(
      "Daily surprise selection count must be between 1 and 8."
    );
  });
});
