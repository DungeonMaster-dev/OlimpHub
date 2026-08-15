export const recurringPatternCalculationVersion = "recurring-patterns-v1";
export const recurringPatternMinimumEvidence = 2;

export type AttemptPatternEvidence = {
  state: "active" | "paused" | "completed" | "abandoned";
  outcome: "solved" | "not_solved" | "partial" | "unknown";
  highestHintLevel: number;
};

export type RecurringEvidencePattern = {
  code:
    | "repeated_unresolved_outcomes"
    | "repeated_abandoned_attempts"
    | "repeated_later_stage_hint_use";
  count: number;
  label: string;
  detail: string;
};

const terminalAttempt = (attempt: AttemptPatternEvidence) =>
  attempt.state === "completed" || attempt.state === "abandoned";

/**
 * Returns repeated persisted patterns only. This projection never diagnoses a
 * cause, labels a learner, predicts outcomes or reads free-form attempt data.
 */
export function buildRecurringPatternAnalysis(
  attempts: AttemptPatternEvidence[]
) {
  const unresolvedOutcomes = attempts.filter(
    attempt => terminalAttempt(attempt) && attempt.outcome === "not_solved"
  ).length;
  const abandonedAttempts = attempts.filter(
    attempt => attempt.state === "abandoned"
  ).length;
  const laterStageHintUse = attempts.filter(
    attempt => attempt.highestHintLevel >= 2
  ).length;
  const recurringPatterns = [
    {
      code: "repeated_unresolved_outcomes" as const,
      count: unresolvedOutcomes,
      label: "Repeated unresolved outcomes",
      detail: `${unresolvedOutcomes} terminal attempt${unresolvedOutcomes === 1 ? "" : "s"} is recorded with a not-solved outcome.`,
    },
    {
      code: "repeated_abandoned_attempts" as const,
      count: abandonedAttempts,
      label: "Repeated abandoned attempts",
      detail: `${abandonedAttempts} attempt${abandonedAttempts === 1 ? "" : "s"} is recorded as abandoned.`,
    },
    {
      code: "repeated_later_stage_hint_use" as const,
      count: laterStageHintUse,
      label: "Repeated later-stage hint use",
      detail: `${laterStageHintUse} attempt${laterStageHintUse === 1 ? "" : "s"} reached hint level 2 or higher.`,
    },
  ].filter(
    pattern => pattern.count >= recurringPatternMinimumEvidence
  ) satisfies RecurringEvidencePattern[];

  return {
    calculationVersion: recurringPatternCalculationVersion,
    minimumEvidence: recurringPatternMinimumEvidence,
    status:
      attempts.length < recurringPatternMinimumEvidence
        ? ("insufficient_evidence" as const)
        : recurringPatterns.length
          ? ("patterns_detected" as const)
          : ("no_recurring_patterns" as const),
    analyzedAttemptCount: attempts.length,
    recurringPatterns,
    limitations: [
      "Patterns describe repeated stored attempt facts, not a learner's cause or mistake.",
      "The analysis does not assess ability, skill, rank, rating, productivity or future outcomes.",
      "The analysis excludes notes, source code, problem statements, raw activity metadata, external handles and credentials.",
    ],
  };
}
