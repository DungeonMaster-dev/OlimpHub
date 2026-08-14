export type SourceSyncObservation = {
  sourceId: string;
  scopeKey: string;
  status: "idle" | "running" | "succeeded" | "failed" | "rate_limited";
  lastStartedAt: Date | null;
  lastFinishedAt: Date | null;
  updatedAt: Date;
  lastError: string | null;
};

export type SourceHealthStatus =
  | "unknown"
  | "healthy"
  | "running"
  | "rate_limited"
  | "degraded"
  | "attention";

function errorCategory(error: string | null) {
  if (!error) return null;
  if (/call limit|rate limit/i.test(error)) return "rate_limited";
  if (/temporar|timeout|abort|network|unavailable|gateway/i.test(error)) {
    return "provider_failure";
  }
  return "configuration_or_data";
}

function later(left: Date | null, right: Date | null) {
  if (!left) return right;
  if (!right) return left;
  return left.getTime() >= right.getTime() ? left : right;
}

export function summarizeSourceHealth(
  observations: SourceSyncObservation[],
  knownSourceIds: string[] = ["codeforces"]
) {
  const sourceIds = Array.from(
    new Set([...knownSourceIds, ...observations.map(item => item.sourceId)])
  ).sort();
  return sourceIds.map(sourceId => {
    const sourceObservations = observations.filter(
      item => item.sourceId === sourceId
    );
    const categories = sourceObservations.map(item =>
      errorCategory(item.lastError)
    );
    const hasRunning = sourceObservations.some(
      item => item.status === "running"
    );
    const hasRateLimit = sourceObservations.some(
      item =>
        item.status === "rate_limited" ||
        errorCategory(item.lastError) === "rate_limited"
    );
    const hasProviderFailure = categories.includes("provider_failure");
    const hasAttention = categories.includes("configuration_or_data");
    const hasSuccess = sourceObservations.some(
      item => item.status === "succeeded"
    );
    const status: SourceHealthStatus = hasRunning
      ? "running"
      : hasRateLimit
        ? "rate_limited"
        : hasProviderFailure
          ? "degraded"
          : hasAttention
            ? "attention"
            : hasSuccess
              ? "healthy"
              : "unknown";
    return {
      sourceId,
      status,
      scopeCount: sourceObservations.length,
      lastStartedAt: sourceObservations.reduce(
        (latest, item) => later(latest, item.lastStartedAt),
        null as Date | null
      ),
      lastFinishedAt: sourceObservations.reduce(
        (latest, item) => later(latest, item.lastFinishedAt),
        null as Date | null
      ),
      latestObservedAt: sourceObservations.reduce(
        (latest, item) => later(latest, item.updatedAt),
        null as Date | null
      ),
    };
  });
}
