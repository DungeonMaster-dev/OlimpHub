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
