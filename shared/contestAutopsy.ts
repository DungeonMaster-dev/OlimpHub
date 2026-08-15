export const contestAutopsyCalculationVersion = "contest-autopsy-v1";

type ContestAutopsyItem = {
  id: number;
  position: number;
  status: string;
  completedAt: Date | null;
  problemId: number;
  problemTitle: string;
};

export function buildContestAutopsy(input: {
  status: string;
  startedAt: Date | null;
  items: ContestAutopsyItem[];
  performance: {
    completionPercentage: number;
    elapsedSeconds: number | null;
    elapsedEvidence: string;
    score: {
      calculationVersion: string;
      available: boolean;
      totalScore: number;
      totalPenaltyMinutes: number;
    };
  };
}) {
  const terminal = input.status === "completed" || input.status === "expired";
  if (!terminal)
    return {
      calculationVersion: contestAutopsyCalculationVersion,
      available: false,
      reason: "contest_not_terminal" as const,
      terminalOutcome: null,
      trace: [],
      summary: null,
    };

  return {
    calculationVersion: contestAutopsyCalculationVersion,
    available: true,
    reason: null,
    terminalOutcome:
      input.status === "completed"
        ? ("all_items_resolved" as const)
        : ("deadline_expired" as const),
    trace: input.items
      .slice()
      .sort((left, right) => left.position - right.position)
      .map(item => {
        const completedElapsedSeconds =
          item.status === "completed" &&
          input.startedAt !== null &&
          item.completedAt !== null &&
          item.completedAt.getTime() >= input.startedAt.getTime()
            ? Math.floor(
                (item.completedAt.getTime() - input.startedAt.getTime()) / 1_000
              )
            : null;
        return {
          itemId: item.id,
          position: item.position,
          status: item.status,
          problemId: item.problemId,
          problemTitle: item.problemTitle,
          completedElapsedSeconds,
          completionEvidence:
            completedElapsedSeconds === null ? "unavailable" : "recorded",
        };
      }),
    summary: {
      completionPercentage: input.performance.completionPercentage,
      elapsedSeconds: input.performance.elapsedSeconds,
      elapsedEvidence: input.performance.elapsedEvidence,
      totalScore: input.performance.score.totalScore,
      totalPenaltyMinutes: input.performance.score.totalPenaltyMinutes,
      scoringAvailable: input.performance.score.available,
    },
  };
}
