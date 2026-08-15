export const adaptiveTrainingCalculationVersion = "adaptive-training-v1";
export const difficultyProgressionCalculationVersion =
  "difficulty-progression-v1";
export const minimumSolvedDifficultiesForProgression = 3;
export const expectedSolveTimeCalculationVersion = "expected-solve-time-v1";
export const minimumCompletedAttemptsForTimeEstimate = 3;

export type AdaptiveTrainingProgressStatus =
  | "not_started"
  | "planned"
  | "in_progress"
  | "paused"
  | "solved"
  | "review"
  | "skipped"
  | "archived";

export type AdaptiveTrainingCandidate = {
  problemId: number;
  difficulty: number | null;
  progressStatus: AdaptiveTrainingProgressStatus | null;
  isInActiveTraining: boolean;
};

export type AdaptiveTrainingReasonCode =
  | "recent_attempt"
  | "goal_alignment"
  | "insufficient_data";

export type AdaptiveTrainingRecommendation = {
  problemId: number;
  score: number;
  reasonCode: AdaptiveTrainingReasonCode;
  reason: string;
};

export type DifficultyProgression =
  | {
      status: "estimated";
      sampleSize: number;
      targetDifficulty: number;
      minDifficulty: number;
      maxDifficulty: number;
      reason: string;
    }
  | {
      status: "insufficient_evidence";
      sampleSize: number;
      targetDifficulty: null;
      minDifficulty: null;
      maxDifficulty: null;
      reason: string;
    };

export type ExpectedSolveTime =
  | {
      status: "estimated";
      sampleSize: number;
      expectedMinutes: number;
      lowerMinutes: number;
      upperMinutes: number;
      reason: string;
    }
  | {
      status: "insufficient_evidence";
      sampleSize: number;
      expectedMinutes: null;
      lowerMinutes: null;
      upperMinutes: null;
      reason: string;
    };

const terminalProgressStatuses = new Set<AdaptiveTrainingProgressStatus>([
  "solved",
  "skipped",
  "archived",
]);

function recommendationFor(candidate: AdaptiveTrainingCandidate): {
  score: number;
  reasonCode: AdaptiveTrainingReasonCode;
  reason: string;
} {
  if (
    candidate.progressStatus === "in_progress" ||
    candidate.progressStatus === "paused"
  ) {
    return {
      score: candidate.progressStatus === "in_progress" ? 100 : 90,
      reasonCode: "recent_attempt",
      reason:
        "Prioritized because your personal progress still has an unfinished attempt.",
    };
  }
  if (candidate.progressStatus === "planned") {
    return {
      score: 80,
      reasonCode: "goal_alignment",
      reason:
        "Prioritized because you explicitly marked this problem for practice.",
    };
  }
  if (candidate.progressStatus === "review") {
    return {
      score: 60,
      reasonCode: "goal_alignment",
      reason:
        "Included because your personal progress marks this problem for review.",
    };
  }
  return {
    score: 20,
    reasonCode: "insufficient_data",
    reason:
      "Included from the available catalogue because there is not yet enough personal history to prioritize a different new problem.",
  };
}

export function selectAdaptiveTrainingProblems(
  candidates: AdaptiveTrainingCandidate[],
  count: number,
  targetDifficulty: number | null = null
): AdaptiveTrainingRecommendation[] {
  if (!Number.isInteger(count) || count < 1 || count > 8) {
    throw new Error("Adaptive training count must be between 1 and 8.");
  }

  return candidates
    .filter(
      candidate =>
        !candidate.isInActiveTraining &&
        !(
          candidate.progressStatus &&
          terminalProgressStatuses.has(candidate.progressStatus)
        )
    )
    .map(candidate => ({
      problemId: candidate.problemId,
      difficulty: candidate.difficulty,
      ...recommendationFor(candidate),
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        (targetDifficulty === null
          ? (left.difficulty ?? Number.MAX_SAFE_INTEGER) -
            (right.difficulty ?? Number.MAX_SAFE_INTEGER)
          : Math.abs(
              (left.difficulty ?? Number.MAX_SAFE_INTEGER) - targetDifficulty
            ) -
            Math.abs(
              (right.difficulty ?? Number.MAX_SAFE_INTEGER) - targetDifficulty
            )) ||
        left.problemId - right.problemId
    )
    .slice(0, count)
    .map(({ problemId, score, reasonCode, reason }) => ({
      problemId,
      score,
      reasonCode,
      reason,
    }));
}

export function calculateDifficultyProgression(
  solvedDifficulties: Array<number | null | undefined>
): DifficultyProgression {
  const verified = solvedDifficulties
    .filter(
      (difficulty): difficulty is number =>
        typeof difficulty === "number" &&
        Number.isFinite(difficulty) &&
        difficulty > 0
    )
    .slice(0, minimumSolvedDifficultiesForProgression);
  if (verified.length < minimumSolvedDifficultiesForProgression) {
    return {
      status: "insufficient_evidence",
      sampleSize: verified.length,
      targetDifficulty: null,
      minDifficulty: null,
      maxDifficulty: null,
      reason: `Need ${minimumSolvedDifficultiesForProgression} recent solved problems with verified difficulty before setting a progression target.`,
    };
  }
  const ordered = [...verified].sort((left, right) => left - right);
  const median = ordered[Math.floor(ordered.length / 2)]!;
  const targetDifficulty = Math.max(
    800,
    Math.min(3500, Math.round((median + 100) / 100) * 100)
  );
  return {
    status: "estimated",
    sampleSize: verified.length,
    targetDifficulty,
    minDifficulty: Math.max(800, targetDifficulty - 200),
    maxDifficulty: Math.min(3500, targetDifficulty + 200),
    reason: `Target is one verified difficulty step above the median of your ${verified.length} most recent solved problems.`,
  };
}

export function calculateExpectedSolveTime(
  completedElapsedMs: Array<number | null | undefined>
): ExpectedSolveTime {
  const verified = completedElapsedMs
    .filter(
      (elapsed): elapsed is number =>
        typeof elapsed === "number" &&
        Number.isFinite(elapsed) &&
        elapsed >= 60_000 &&
        elapsed <= 14_400_000
    )
    .slice(0, 5);
  if (verified.length < minimumCompletedAttemptsForTimeEstimate) {
    return {
      status: "insufficient_evidence",
      sampleSize: verified.length,
      expectedMinutes: null,
      lowerMinutes: null,
      upperMinutes: null,
      reason: `Need ${minimumCompletedAttemptsForTimeEstimate} completed attempts with bounded elapsed time before estimating solve time.`,
    };
  }
  const sorted = [...verified].sort((left, right) => left - right);
  const medianMs = sorted[Math.floor(sorted.length / 2)]!;
  const expectedMinutes = Math.max(1, Math.round(medianMs / 60_000));
  return {
    status: "estimated",
    sampleSize: verified.length,
    expectedMinutes,
    lowerMinutes: Math.max(1, Math.round(expectedMinutes * 0.7)),
    upperMinutes: Math.round(expectedMinutes * 1.3),
    reason: `Estimate is the median elapsed time across your ${verified.length} recent completed attempts with bounded duration.`,
  };
}
