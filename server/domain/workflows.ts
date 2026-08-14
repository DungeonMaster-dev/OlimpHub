export const codeforcesCooldownMs = 60_000;

export function canBeginCodeforcesSync(
  lastStartedAt: Date | null | undefined,
  now = new Date()
) {
  return (
    !lastStartedAt ||
    now.getTime() - lastStartedAt.getTime() >= codeforcesCooldownMs
  );
}

export function shouldWriteAttemptTransition(
  currentState: string,
  nextState: string,
  currentOutcome: string,
  nextOutcome: string
) {
  return currentState !== nextState || currentOutcome !== nextOutcome;
}

export function nextTrainingItemStatus(
  current: "queued" | "active" | "completed" | "skipped",
  requested: "queued" | "active" | "completed" | "skipped"
) {
  if (current === "completed" || current === "skipped") return current;
  return requested;
}

export function normalizeCatalogueInput(input: {
  query?: string;
  tag?: string;
  source?: string;
  skillId?: number;
  minDifficulty?: number;
}) {
  return {
    query: input.query?.trim() || undefined,
    tag: input.tag?.trim().toLowerCase() || undefined,
    source: input.source?.trim().toLowerCase() || undefined,
    skillId: input.skillId && input.skillId > 0 ? input.skillId : undefined,
    minDifficulty:
      input.minDifficulty && input.minDifficulty >= 0
        ? input.minDifficulty
        : undefined,
  };
}
