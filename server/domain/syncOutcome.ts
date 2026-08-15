export type SourceSyncFailureStatus = "failed" | "rate_limited";

export function classifySourceSyncFailure(error: unknown): {
  status: SourceSyncFailureStatus;
  message: string;
} {
  const message =
    error instanceof Error
      ? error.message.slice(0, 500)
      : error
        ? "Unknown synchronization failure."
        : "";
  return {
    status: /call limit|rate limit|wait one minute|too many requests/i.test(
      message
    )
      ? "rate_limited"
      : "failed",
    message,
  };
}
