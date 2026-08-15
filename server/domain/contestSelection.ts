export const contestSelectionCalculationVersion = "contest-selection-v1";

export type ContestSelectionProgressStatus =
  | "not_started"
  | "planned"
  | "in_progress"
  | "paused"
  | "solved"
  | "review"
  | "skipped"
  | "archived";

export type ContestSelectionCandidate = {
  problemId: number;
  difficulty: number | null;
  progressStatus: ContestSelectionProgressStatus | null;
  isInActiveContest: boolean;
};

export type ContestSelectionReasonCode =
  | "unfinished_work"
  | "planned_or_review"
  | "catalogue_fallback";

const terminalStatuses = new Set<ContestSelectionProgressStatus>([
  "solved",
  "skipped",
  "archived",
]);

function priorityFor(candidate: ContestSelectionCandidate) {
  if (
    candidate.progressStatus === "in_progress" ||
    candidate.progressStatus === "paused"
  )
    return {
      priority: candidate.progressStatus === "in_progress" ? 100 : 90,
      reasonCode: "unfinished_work" as const,
      reason:
        "Included because your personal progress has unfinished work on this problem.",
    };
  if (
    candidate.progressStatus === "planned" ||
    candidate.progressStatus === "review"
  )
    return {
      priority: candidate.progressStatus === "planned" ? 80 : 60,
      reasonCode: "planned_or_review" as const,
      reason:
        "Included because your personal progress marks this problem for planned work or review.",
    };
  return {
    priority: 20,
    reasonCode: "catalogue_fallback" as const,
    reason:
      "Included from available catalogue problems because no higher-priority owner-scoped evidence applies.",
  };
}

export function selectContestProblems(
  candidates: ContestSelectionCandidate[],
  count: number
) {
  if (!Number.isInteger(count) || count < 1 || count > 8)
    throw new Error("Contest selection count must be between 1 and 8.");

  return candidates
    .filter(
      candidate =>
        !candidate.isInActiveContest &&
        !(
          candidate.progressStatus &&
          terminalStatuses.has(candidate.progressStatus)
        )
    )
    .map(candidate => ({ ...candidate, ...priorityFor(candidate) }))
    .sort(
      (left, right) =>
        right.priority - left.priority ||
        (left.difficulty ?? Number.MAX_SAFE_INTEGER) -
          (right.difficulty ?? Number.MAX_SAFE_INTEGER) ||
        left.problemId - right.problemId
    )
    .slice(0, count)
    .map(({ problemId, priority, reasonCode, reason }) => ({
      problemId,
      priority,
      reasonCode,
      reason,
    }));
}
