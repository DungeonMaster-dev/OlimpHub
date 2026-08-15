export type TrainingItemOutcome = "queued" | "active" | "completed" | "skipped";

export function summarizeTrainingOutcomes(outcomes: TrainingItemOutcome[]) {
  const completed = outcomes.filter(outcome => outcome === "completed").length;
  const skipped = outcomes.filter(outcome => outcome === "skipped").length;
  const unresolved = outcomes.length - completed - skipped;
  return {
    total: outcomes.length,
    completed,
    skipped,
    unresolved,
    completionRate:
      outcomes.length === 0
        ? null
        : Math.round((completed / outcomes.length) * 100),
  };
}
