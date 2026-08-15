export function summarizeContestOutcomes(
  itemStatuses: Array<"queued" | "active" | "completed" | "skipped">
) {
  const completed = itemStatuses.filter(
    status => status === "completed"
  ).length;
  const skipped = itemStatuses.filter(status => status === "skipped").length;
  const resolved = completed + skipped;
  return {
    completed,
    skipped,
    resolved,
    completionRate:
      itemStatuses.length > 0
        ? Math.round((resolved / itemStatuses.length) * 100)
        : null,
  };
}

export const contestAnalysisCalculationVersion = "contest-analysis-v1";

export function buildContestAnalysis(input: {
  status: string;
  performance: {
    completionPercentage: number;
    elapsedSeconds: number | null;
    elapsedEvidence: string;
    completedItems: number;
    skippedItems: number;
    unfinishedItems: number;
    score: {
      available: boolean;
      totalScore: number;
      totalPenaltyMinutes: number;
    };
  };
  autopsy: {
    available: boolean;
    terminalOutcome: string | null;
    trace: Array<{
      itemId: number;
      position: number;
      status: string;
      problemId: number;
      problemTitle: string;
      completedElapsedSeconds: number | null;
      completionEvidence: string;
    }>;
  };
}) {
  if (!input.autopsy.available)
    return {
      calculationVersion: contestAnalysisCalculationVersion,
      available: false,
      reason: "contest_not_terminal" as const,
      facts: null,
      items: [],
      limitations: [
        "Analysis is available only after a contest is completed or expired.",
      ],
    };
  return {
    calculationVersion: contestAnalysisCalculationVersion,
    available: true,
    reason: null,
    facts: {
      status: input.status,
      terminalOutcome: input.autopsy.terminalOutcome,
      completionPercentage: input.performance.completionPercentage,
      elapsedSeconds: input.performance.elapsedSeconds,
      elapsedEvidence: input.performance.elapsedEvidence,
      completedItems: input.performance.completedItems,
      skippedItems: input.performance.skippedItems,
      unfinishedItems: input.performance.unfinishedItems,
      scoreAvailable: input.performance.score.available,
      totalScore: input.performance.score.totalScore,
      totalPenaltyMinutes: input.performance.score.totalPenaltyMinutes,
    },
    items: input.autopsy.trace,
    limitations: [
      "This is a factual terminal projection of persisted contest evidence.",
      "It does not infer rank, rating, skill, strategy, mistake cause, problem quality or future outcomes.",
    ],
  };
}
