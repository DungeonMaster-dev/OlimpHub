import { describe, expect, it } from "vitest";
import {
  adaptiveTrainingCalculationVersion,
  calculateDifficultyProgression,
  calculateExpectedSolveTime,
  difficultyProgressionCalculationVersion,
  expectedSolveTimeCalculationVersion,
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

  it("sets a bounded next-step difficulty target from three verified recent solves", () => {
    expect(difficultyProgressionCalculationVersion).toBe(
      "difficulty-progression-v1"
    );
    expect(calculateDifficultyProgression([1200, 1400, 1000])).toEqual({
      status: "estimated",
      sampleSize: 3,
      targetDifficulty: 1300,
      minDifficulty: 1100,
      maxDifficulty: 1500,
      reason:
        "Target is one verified difficulty step above the median of your 3 most recent solved problems.",
    });
    expect(
      selectAdaptiveTrainingProblems(
        [
          {
            problemId: 10,
            difficulty: 1200,
            progressStatus: null,
            isInActiveTraining: false,
          },
          {
            problemId: 11,
            difficulty: 1300,
            progressStatus: null,
            isInActiveTraining: false,
          },
        ],
        2,
        1300
      ).map(item => item.problemId)
    ).toEqual([11, 10]);
  });

  it("returns insufficient evidence instead of inferring a target from too little solved history", () => {
    expect(calculateDifficultyProgression([1200, null, 1400])).toEqual({
      status: "insufficient_evidence",
      sampleSize: 2,
      targetDifficulty: null,
      minDifficulty: null,
      maxDifficulty: null,
      reason:
        "Need 3 recent solved problems with verified difficulty before setting a progression target.",
    });
  });

  it("derives a bounded median elapsed-time estimate from completed attempts only", () => {
    expect(expectedSolveTimeCalculationVersion).toBe("expected-solve-time-v1");
    expect(
      calculateExpectedSolveTime([10 * 60_000, 20 * 60_000, 30 * 60_000])
    ).toEqual({
      status: "estimated",
      sampleSize: 3,
      expectedMinutes: 20,
      lowerMinutes: 14,
      upperMinutes: 26,
      reason:
        "Estimate is the median elapsed time across your 3 recent completed attempts with bounded duration.",
    });
  });

  it("does not estimate solve time from too few, implausibly short or unbounded attempt durations", () => {
    expect(calculateExpectedSolveTime([30_000, 15 * 60_000, null])).toEqual({
      status: "insufficient_evidence",
      sampleSize: 1,
      expectedMinutes: null,
      lowerMinutes: null,
      upperMinutes: null,
      reason:
        "Need 3 completed attempts with bounded elapsed time before estimating solve time.",
    });
  });
});
