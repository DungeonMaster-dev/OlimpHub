export const contestPerformanceCalculationVersion = "contest-performance-v1";

type ContestPerformanceItem = {
  status: "queued" | "active" | "completed" | "skipped";
  completedAt: Date | null;
};

export function summarizeContestPerformance(input: {
  status: string;
  startedAt: Date | null;
  completedAt: Date | null;
  expiresAt: Date | null;
  observedAt: Date;
  items: ContestPerformanceItem[];
  scoring: {
    calculationVersion: string;
    available: boolean;
    completedItems: number;
    unscoredCompletedItems: number;
    totalScore: number;
    totalPenaltyMinutes: number;
  };
}) {
  const completedItems = input.items.filter(
    item => item.status === "completed"
  ).length;
  const skippedItems = input.items.filter(
    item => item.status === "skipped"
  ).length;
  const totalItems = input.items.length;
  const terminalItems = completedItems + skippedItems;
  const validTimedCompletedItems = input.items.filter(
    item =>
      item.status === "completed" &&
      input.startedAt !== null &&
      item.completedAt !== null &&
      item.completedAt.getTime() >= input.startedAt.getTime()
  ).length;
  const endAt =
    input.status === "completed"
      ? input.completedAt
      : input.status === "expired"
        ? input.expiresAt
        : input.status === "active"
          ? input.observedAt
          : null;
  const elapsedSeconds =
    input.startedAt && endAt
      ? Math.max(
          0,
          Math.floor((endAt.getTime() - input.startedAt.getTime()) / 1_000)
        )
      : null;

  return {
    calculationVersion: contestPerformanceCalculationVersion,
    status: input.status,
    totalItems,
    completedItems,
    skippedItems,
    unfinishedItems: totalItems - terminalItems,
    completionPercentage:
      totalItems === 0 ? 0 : Math.round((terminalItems / totalItems) * 100),
    elapsedSeconds,
    elapsedEvidence:
      elapsedSeconds === null
        ? "unavailable"
        : input.status === "active"
          ? "server_observation"
          : "terminal_timestamp",
    validTimedCompletedItems,
    unavailableTimedCompletedItems: completedItems - validTimedCompletedItems,
    score: input.scoring,
  };
}
