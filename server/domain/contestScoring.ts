export const contestScoringCalculationVersion = "completion-time-v1";
export const contestPointsPerCompletedItem = 100;

type ContestScoreItem = {
  status: "queued" | "active" | "completed" | "skipped";
  completedAt: Date | null;
};

export function summarizeContestScore(input: {
  startedAt: Date | null;
  items: ContestScoreItem[];
}) {
  const persistedCompletedItems = input.items.filter(
    item => item.status === "completed"
  );
  if (!input.startedAt)
    return {
      calculationVersion: contestScoringCalculationVersion,
      available: false,
      reason: "contest_not_started" as const,
      completedItems: 0,
      unscoredCompletedItems: persistedCompletedItems.length,
      totalScore: 0,
      totalPenaltyMinutes: 0,
    };

  const scoredItems = persistedCompletedItems.filter(
    item =>
      item.completedAt !== null &&
      item.completedAt.getTime() >= input.startedAt!.getTime()
  );
  const totalPenaltyMinutes = scoredItems.reduce((sum, item) => {
    const elapsedMilliseconds =
      item.completedAt!.getTime() - input.startedAt!.getTime();
    return sum + Math.max(0, Math.ceil(elapsedMilliseconds / 60_000));
  }, 0);

  return {
    calculationVersion: contestScoringCalculationVersion,
    available: true,
    reason: null,
    completedItems: scoredItems.length,
    unscoredCompletedItems: persistedCompletedItems.length - scoredItems.length,
    totalScore: scoredItems.length * contestPointsPerCompletedItem,
    totalPenaltyMinutes,
  };
}
