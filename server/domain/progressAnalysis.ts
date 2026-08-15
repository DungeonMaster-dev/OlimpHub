import type { StructuredUserContext } from "../ai/userContext";

export const progressAnalysisCalculationVersion = "progress-analysis-v1";

export type ProgressAnalysisObservation = {
  code:
    | "solved_progress"
    | "open_progress"
    | "planned_or_review_progress"
    | "active_attempts"
    | "completed_training_sessions"
    | "completed_contest_sessions";
  count: number;
  label: string;
  detail: string;
};

const count = (values: Record<string, number>, key: string) => values[key] ?? 0;

const sum = (values: Record<string, number>) =>
  Object.values(values).reduce((total, value) => total + value, 0);

/**
 * Projects the smallest aggregate AI context into an explainable factual
 * progress snapshot. It is deliberately not a score, trajectory or prediction.
 */
export function buildFactualProgressAnalysis(context: StructuredUserContext) {
  const solved = count(context.progressByStatus, "solved");
  const open =
    count(context.progressByStatus, "in_progress") +
    count(context.progressByStatus, "paused");
  const plannedOrReview =
    count(context.progressByStatus, "planned") +
    count(context.progressByStatus, "review");
  const activeAttempts = count(context.attemptsByState, "active");
  const completedTraining = count(
    context.trainingSessionsByStatus,
    "completed"
  );
  const completedContests = count(context.contestSessionsByStatus, "completed");
  const evidence = {
    progressRecords: sum(context.progressByStatus),
    attempts: sum(context.attemptsByState),
    trainingSessions: sum(context.trainingSessionsByStatus),
    contestSessions: sum(context.contestSessionsByStatus),
  };

  return {
    calculationVersion: progressAnalysisCalculationVersion,
    contextVersion: context.contextVersion,
    status: Object.values(evidence).some(value => value > 0)
      ? ("available" as const)
      : ("insufficient_evidence" as const),
    observations: [
      {
        code: "solved_progress" as const,
        count: solved,
        label: "Solved progress records",
        detail: `${solved} persisted problem-progress record${solved === 1 ? "" : "s"} is marked solved.`,
      },
      {
        code: "open_progress" as const,
        count: open,
        label: "Open progress records",
        detail: `${open} persisted problem-progress record${open === 1 ? "" : "s"} is in progress or paused.`,
      },
      {
        code: "planned_or_review_progress" as const,
        count: plannedOrReview,
        label: "Planned or review records",
        detail: `${plannedOrReview} persisted problem-progress record${plannedOrReview === 1 ? "" : "s"} is planned or awaiting review.`,
      },
      {
        code: "active_attempts" as const,
        count: activeAttempts,
        label: "Active attempts",
        detail: `${activeAttempts} solving attempt${activeAttempts === 1 ? "" : "s"} is currently active.`,
      },
      {
        code: "completed_training_sessions" as const,
        count: completedTraining,
        label: "Completed training sessions",
        detail: `${completedTraining} training session${completedTraining === 1 ? "" : "s"} is recorded as completed.`,
      },
      {
        code: "completed_contest_sessions" as const,
        count: completedContests,
        label: "Completed contest sessions",
        detail: `${completedContests} contest session${completedContests === 1 ? "" : "s"} is recorded as completed.`,
      },
    ] satisfies ProgressAnalysisObservation[],
    evidence,
    limitations: [
      "No time window is present, so this analysis does not describe a trend.",
      "Counts do not measure ability, rank, rating, productivity or future outcomes.",
      "The analysis excludes notes, source code, raw activity metadata, external handles and credentials.",
    ],
  };
}
