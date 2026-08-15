import { describe, expect, it } from "vitest";
import {
  contestSelectionCalculationVersion,
  selectContestProblems,
} from "./contestSelection";

describe("contest problem selection", () => {
  it("prioritizes unfinished owner work, excludes terminal and active-contest problems, then falls back deterministically", () => {
    expect(
      selectContestProblems(
        [
          {
            problemId: 1,
            difficulty: 1800,
            progressStatus: "solved",
            isInActiveContest: false,
          },
          {
            problemId: 2,
            difficulty: 1500,
            progressStatus: "paused",
            isInActiveContest: false,
          },
          {
            problemId: 3,
            difficulty: 900,
            progressStatus: "planned",
            isInActiveContest: false,
          },
          {
            problemId: 4,
            difficulty: 800,
            progressStatus: null,
            isInActiveContest: false,
          },
          {
            problemId: 5,
            difficulty: 700,
            progressStatus: "in_progress",
            isInActiveContest: true,
          },
          {
            problemId: 6,
            difficulty: 600,
            progressStatus: "skipped",
            isInActiveContest: false,
          },
        ],
        4
      )
    ).toEqual([
      expect.objectContaining({ problemId: 2, reasonCode: "unfinished_work" }),
      expect.objectContaining({
        problemId: 3,
        reasonCode: "planned_or_review",
      }),
      expect.objectContaining({
        problemId: 4,
        reasonCode: "catalogue_fallback",
      }),
    ]);
  });

  it("uses difficulty then canonical ID as stable fallback tie-breakers", () => {
    expect(
      selectContestProblems(
        [
          {
            problemId: 20,
            difficulty: 1200,
            progressStatus: null,
            isInActiveContest: false,
          },
          {
            problemId: 7,
            difficulty: 1000,
            progressStatus: null,
            isInActiveContest: false,
          },
          {
            problemId: 10,
            difficulty: 1200,
            progressStatus: null,
            isInActiveContest: false,
          },
        ],
        3
      ).map(item => item.problemId)
    ).toEqual([7, 10, 20]);
  });

  it("keeps a versioned bounded contract", () => {
    expect(contestSelectionCalculationVersion).toBe("contest-selection-v1");
    expect(() => selectContestProblems([], 0)).toThrow(
      "Contest selection count must be between 1 and 8."
    );
    expect(() => selectContestProblems([], 9)).toThrow(
      "Contest selection count must be between 1 and 8."
    );
  });
});
