import {
  calculateDifficultyProgression,
  type AdaptiveTrainingProgressStatus,
} from "./adaptiveTraining";

export const problemRecommendationCalculationVersion =
  "problem-recommendations-v1";

export type ProblemRecommendationCandidate = {
  problemId: number;
  difficulty: number | null;
  progressStatus: AdaptiveTrainingProgressStatus | null;
  availability: "eligible" | "active_training" | "active_contest";
};

export type ProblemRecommendation = {
  problemId: number;
  score: number;
  reasonCode:
    | "unfinished_progress"
    | "planned_practice"
    | "review_practice"
    | "catalogue_fallback";
  reason: string;
};

const terminalStatuses = new Set<AdaptiveTrainingProgressStatus>([
  "solved",
  "skipped",
  "archived",
]);

function reasonFor(candidate: ProblemRecommendationCandidate) {
  if (candidate.progressStatus === "in_progress")
    return {
      score: 100,
      reasonCode: "unfinished_progress" as const,
      reason: "Prioritized because its personal progress is still in progress.",
    };
  if (candidate.progressStatus === "paused")
    return {
      score: 90,
      reasonCode: "unfinished_progress" as const,
      reason:
        "Prioritized because its personal progress is paused, not terminal.",
    };
  if (candidate.progressStatus === "planned")
    return {
      score: 80,
      reasonCode: "planned_practice" as const,
      reason:
        "Prioritized because personal progress explicitly marks it planned.",
    };
  if (candidate.progressStatus === "review")
    return {
      score: 70,
      reasonCode: "review_practice" as const,
      reason: "Included because personal progress marks it for review.",
    };
  return {
    score: 20,
    reasonCode: "catalogue_fallback" as const,
    reason:
      "Included from eligible catalogue evidence because no stronger personal priority is recorded.",
  };
}

/**
 * Produces an evidence-bounded private recommendation projection. It does not
 * infer ability, skill, future outcomes or a cause for any prior attempt.
 */
export function buildProblemRecommendationProjection(input: {
  candidates: ProblemRecommendationCandidate[];
  solvedDifficulties: Array<number | null | undefined>;
  count: number;
}) {
  if (!Number.isInteger(input.count) || input.count < 1 || input.count > 8) {
    throw new Error("Problem recommendation count must be between 1 and 8.");
  }
  const progression = calculateDifficultyProgression(input.solvedDifficulties);
  const eligible = input.candidates
    .filter(
      candidate =>
        candidate.availability === "eligible" &&
        !(
          candidate.progressStatus &&
          terminalStatuses.has(candidate.progressStatus)
        )
    )
    .map(candidate => ({
      ...candidate,
      ...reasonFor(candidate),
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        (progression.targetDifficulty === null
          ? (left.difficulty ?? Number.MAX_SAFE_INTEGER) -
            (right.difficulty ?? Number.MAX_SAFE_INTEGER)
          : Math.abs(
              (left.difficulty ?? Number.MAX_SAFE_INTEGER) -
                progression.targetDifficulty
            ) -
            Math.abs(
              (right.difficulty ?? Number.MAX_SAFE_INTEGER) -
                progression.targetDifficulty
            )) ||
        left.problemId - right.problemId
    )
    .slice(0, input.count)
    .map(
      ({ problemId, score, reasonCode, reason }): ProblemRecommendation => ({
        problemId,
        score,
        reasonCode,
        reason,
      })
    );
  return {
    calculationVersion: problemRecommendationCalculationVersion,
    status: input.candidates.length
      ? ("ready" as const)
      : ("insufficient_catalogue" as const),
    progression,
    exclusions: [
      "solved_skipped_or_archived_progress",
      "active_training_assignment",
      "active_contest_assignment",
    ],
    recommendations: eligible,
    limitations: [
      "Recommendations use persisted catalogue, progress and session facts only.",
      "They do not assess ability, skill, rank, rating, productivity or future outcomes.",
      "They exclude notes, source code, raw activity metadata, external handles and credentials.",
    ],
  };
}
