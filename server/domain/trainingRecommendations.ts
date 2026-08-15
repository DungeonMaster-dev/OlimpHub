import type { ExpectedSolveTime } from "./adaptiveTraining";
import type { ProblemRecommendation } from "./problemRecommendations";

export const trainingRecommendationCalculationVersion =
  "training-recommendations-v1";

/** Builds an editable training proposal from already evidence-bounded facts. */
export function buildTrainingRecommendationPlan(input: {
  problemRecommendations: ProblemRecommendation[];
  expectedSolveTime: ExpectedSolveTime;
}) {
  const problemIds = input.problemRecommendations.map(
    recommendation => recommendation.problemId
  );
  const expectedDuration =
    input.expectedSolveTime.status === "estimated"
      ? {
          status: "estimated" as const,
          expectedMinutes:
            input.expectedSolveTime.expectedMinutes * problemIds.length,
          lowerMinutes:
            input.expectedSolveTime.lowerMinutes * problemIds.length,
          upperMinutes:
            input.expectedSolveTime.upperMinutes * problemIds.length,
          reason: `Duration multiplies the bounded per-problem estimate across ${problemIds.length} selected problems.`,
        }
      : {
          status: "insufficient_evidence" as const,
          expectedMinutes: null,
          lowerMinutes: null,
          upperMinutes: null,
          reason: input.expectedSolveTime.reason,
        };
  return {
    calculationVersion: trainingRecommendationCalculationVersion,
    status: problemIds.length
      ? ("ready" as const)
      : ("no_eligible_problems" as const),
    creationHandoff: problemIds.length
      ? {
          title: "Recommended practice",
          problemIds,
        }
      : null,
    expectedDuration,
    recommendations: input.problemRecommendations,
    limitations: [
      "The plan is a deterministic editable suggestion, not a required session.",
      "It does not assess ability, skill, rank, rating, productivity or future outcomes.",
      "It excludes notes, source code, raw activity metadata, external handles and credentials.",
    ],
  };
}
