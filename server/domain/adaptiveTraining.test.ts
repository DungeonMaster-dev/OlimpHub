import { describe, expect, it } from "vitest";
import {
  adaptiveTrainingCalculationVersion,
  selectAdaptiveTrainingProblems,
} from "./adaptiveTraining";

describe("adaptive training selection", () => {
  it("prioritizes unfinished personal work, excludes terminal and active-training problems, then uses stable new-problem fallback", () => {
    expect(
      selectAdaptiveTrainingProblems(
        [
          {
            problemId: 1,
            difficulty: 1800,
            progressStatus: "solved",
            isInActiveTraining: false,
          },
          {
            problemId: 2,
            difficulty: 1500,
            progressStatus: "paused",
            isInActiveTraining: false,
          },
          {
            problemId: 3,
            difficulty: 900,
            progressStatus: "planned",
            isInActiveTraining: false,
          },
          {
            problemId: 4,
            difficulty: 800,
            progressStatus: null,
            isInActiveTraining: false,
          },
          {
            problemId: 5,
            difficulty: 700,
            progressStatus: null,
            isInActiveTraining: true,
          },
          {
            problemId: 6,
            difficulty: 600,
            progressStatus: "skipped",
            isInActiveTraining: false,
          },
        ],
        4
      )
    ).toEqual([
      expect.objectContaining({ problemId: 2, reasonCode: "recent_attempt" }),
      expect.objectContaining({ problemId: 3, reasonCode: "goal_alignment" }),
      expect.objectContaining({
        problemId: 4,
        reasonCode: "insufficient_data",
      }),
    ]);
  });

  it("enforces the bounded selection size and exposes a versioned calculation contract", () => {
    expect(adaptiveTrainingCalculationVersion).toBe("adaptive-training-v1");
    expect(() => selectAdaptiveTrainingProblems([], 0)).toThrow(
      "Adaptive training count must be between 1 and 8."
    );
    expect(() => selectAdaptiveTrainingProblems([], 9)).toThrow(
      "Adaptive training count must be between 1 and 8."
    );
  });
});
