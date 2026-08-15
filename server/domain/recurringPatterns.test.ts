import { describe, expect, it } from "vitest";
import {
  buildRecurringPatternAnalysis,
  recurringPatternCalculationVersion,
  recurringPatternMinimumEvidence,
} from "./recurringPatterns";

describe("recurring attempt evidence patterns", () => {
  it("returns only repeated persisted facts without assigning a causal diagnosis", () => {
    const analysis = buildRecurringPatternAnalysis([
      { state: "completed", outcome: "not_solved", highestHintLevel: 2 },
      { state: "abandoned", outcome: "unknown", highestHintLevel: 3 },
      { state: "completed", outcome: "not_solved", highestHintLevel: 2 },
      { state: "abandoned", outcome: "solved", highestHintLevel: 0 },
    ]);

    expect(analysis).toMatchObject({
      calculationVersion: recurringPatternCalculationVersion,
      minimumEvidence: recurringPatternMinimumEvidence,
      status: "patterns_detected",
      analyzedAttemptCount: 4,
      recurringPatterns: expect.arrayContaining([
        expect.objectContaining({
          code: "repeated_unresolved_outcomes",
          count: 2,
        }),
        expect.objectContaining({
          code: "repeated_abandoned_attempts",
          count: 2,
        }),
        expect.objectContaining({
          code: "repeated_later_stage_hint_use",
          count: 3,
        }),
      ]),
    });
    expect(analysis.limitations.join(" ")).toMatch(/does not assess ability/i);
  });

  it("makes insufficient evidence explicit before applying a repeated-pattern threshold", () => {
    expect(
      buildRecurringPatternAnalysis([
        { state: "completed", outcome: "not_solved", highestHintLevel: 2 },
      ])
    ).toMatchObject({
      status: "insufficient_evidence",
      analyzedAttemptCount: 1,
      recurringPatterns: [],
    });
  });
});
