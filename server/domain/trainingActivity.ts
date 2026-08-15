export function isTrainingSessionComplete(
  itemStatuses: Array<"queued" | "active" | "completed" | "skipped">
) {
  return (
    itemStatuses.length > 0 &&
    itemStatuses.every(status => status === "completed" || status === "skipped")
  );
}
