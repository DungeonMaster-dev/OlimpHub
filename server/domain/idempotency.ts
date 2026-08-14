import { createHash } from "node:crypto";

export function createActivityEventId(input: {
  userId: number;
  eventType: string;
  attemptId?: number | null;
  problemId?: number | null;
  metadata?: Record<string, unknown>;
}) {
  const payload = JSON.stringify({
    userId: input.userId,
    eventType: input.eventType,
    attemptId: input.attemptId ?? null,
    problemId: input.problemId ?? null,
    metadata: input.metadata ?? {},
  });
  return createHash("sha256").update(payload).digest("hex").slice(0, 96);
}
