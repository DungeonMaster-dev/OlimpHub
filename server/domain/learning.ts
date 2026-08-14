export const hintStages = ["orientation", "strategy", "subproblem"] as const;

export type HintStage = (typeof hintStages)[number];

export function nextPermittedHintLevel(highestRevealedLevel: number): number {
  if (!Number.isInteger(highestRevealedLevel) || highestRevealedLevel < -1) {
    throw new Error("Invalid persisted hint level.");
  }
  return highestRevealedLevel + 1;
}

export function hintStageForLevel(level: number): HintStage | null {
  return hintStages[level] ?? null;
}

export function normalizeCodeforcesHandle(handle: string): string {
  const trimmed = handle.trim();
  if (!/^[A-Za-z0-9_.-]{3,64}$/.test(trimmed)) {
    throw new Error("Codeforces handle format is invalid.");
  }
  return trimmed.toLowerCase();
}

export function buildAnalyticsEvidence(metrics: {
  solvedProblems: number;
  startedAttempts: number;
  activeAttempts: number;
}) {
  return [
    {
      metricKey: "solvedProblems",
      reasonCode: "solved_progress_records",
      detail: `${metrics.solvedProblems} personal progress record(s) entered solved status within the selected period.`,
    },
    {
      metricKey: "startedAttempts",
      reasonCode: "attempt_started_at",
      detail: `${metrics.startedAttempts} attempt(s) were started within the selected period.`,
    },
    {
      metricKey: "activeAttempts",
      reasonCode: "current_attempt_state",
      detail: `${metrics.activeAttempts} attempt(s) are currently active or paused.`,
    },
  ] as const;
}
