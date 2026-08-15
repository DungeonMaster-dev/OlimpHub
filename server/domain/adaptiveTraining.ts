export const adaptiveTrainingCalculationVersion = "adaptive-training-v1";

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
  count: number
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
        (left.difficulty ?? Number.MAX_SAFE_INTEGER) -
          (right.difficulty ?? Number.MAX_SAFE_INTEGER) ||
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
