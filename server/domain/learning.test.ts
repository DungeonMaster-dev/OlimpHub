import { describe, expect, it } from "vitest";
import {
  buildAnalyticsEvidence,
  hintStageForLevel,
  nextPermittedHintLevel,
  normalizeCodeforcesHandle,
} from "./learning";

describe("progressive hint policy", () => {
  it("only advances one disclosure level at a time", () => {
    expect(nextPermittedHintLevel(-1)).toBe(0);
    expect(nextPermittedHintLevel(0)).toBe(1);
    expect(nextPermittedHintLevel(1)).toBe(2);
  });

  it("keeps the approved pedagogical stages in order", () => {
    expect(hintStageForLevel(0)).toBe("orientation");
    expect(hintStageForLevel(1)).toBe("strategy");
    expect(hintStageForLevel(2)).toBe("subproblem");
    expect(hintStageForLevel(3)).toBeNull();
  });

  it("rejects corrupted disclosure state rather than bypassing it", () => {
    expect(() => nextPermittedHintLevel(-2)).toThrow(
      "Invalid persisted hint level"
    );
    expect(() => nextPermittedHintLevel(1.5)).toThrow(
      "Invalid persisted hint level"
    );
  });
});

describe("explainable learner evidence", () => {
  it("attaches deterministic reasons to every calculated metric", () => {
    expect(
      buildAnalyticsEvidence({
        solvedProblems: 2,
        startedAttempts: 4,
        activeAttempts: 1,
      })
    ).toEqual([
      {
        metricKey: "solvedProblems",
        reasonCode: "solved_progress_records",
        detail:
          "2 personal progress record(s) entered solved status within the selected period.",
      },
      {
        metricKey: "startedAttempts",
        reasonCode: "attempt_started_at",
        detail: "4 attempt(s) were started within the selected period.",
      },
      {
        metricKey: "activeAttempts",
        reasonCode: "current_attempt_state",
        detail: "1 attempt(s) are currently active or paused.",
      },
    ]);
  });
});

describe("Codeforces handle normalization", () => {
  it("normalizes identity comparisons without changing the entered display value", () => {
    expect(normalizeCodeforcesHandle("  Tourist_42 ")).toBe("tourist_42");
  });

  it("rejects unsafe or malformed handles", () => {
    expect(() => normalizeCodeforcesHandle("ab")).toThrow("format is invalid");
    expect(() => normalizeCodeforcesHandle("handle with space")).toThrow(
      "format is invalid"
    );
  });
});
