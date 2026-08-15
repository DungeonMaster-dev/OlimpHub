export const structuredUserContextVersion = "user-context-v1";

type CountRow = { status: string; count: number | string };

function normalizeCounts(rows: CountRow[]) {
  return Object.fromEntries(
    rows
      .map(row => [row.status, Number(row.count)] as const)
      .sort(([left], [right]) => left.localeCompare(right))
  );
}

export function buildStructuredUserContext(input: {
  preferences: {
    timeZone: string;
    weeklyGoal: number;
    activityTracking: "enabled" | "minimal";
  };
  progress: CountRow[];
  attempts: CountRow[];
  trainingSessions: CountRow[];
  contestSessions: CountRow[];
}) {
  return {
    contextVersion: structuredUserContextVersion,
    preferences: input.preferences,
    progressByStatus: normalizeCounts(input.progress),
    attemptsByState: normalizeCounts(input.attempts),
    trainingSessionsByStatus: normalizeCounts(input.trainingSessions),
    contestSessionsByStatus: normalizeCounts(input.contestSessions),
    excludedData: [
      "free_form_notes",
      "source_code",
      "raw_activity_metadata",
      "external_handles",
      "session_credentials",
    ],
  };
}
