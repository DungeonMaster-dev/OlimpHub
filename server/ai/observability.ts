import { aiObservabilityEvents } from "../../drizzle/schema";
import { getDb } from "../db";

export type AiObservabilityEvent = {
  userId: number;
  operation: string;
  model?: string | null;
  outcome: "succeeded" | "failed";
  latencyMs: number;
  costMicrounits?: number | null;
  errorCode?: string | null;
};

/**
 * Stores operational metadata only. Prompt and response content are
 * deliberately absent from this API so they cannot be persisted accidentally.
 */
export async function recordAiObservability(event: AiObservabilityEvent) {
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(aiObservabilityEvents).values({
      userId: event.userId,
      operation: event.operation.slice(0, 96),
      model: event.model?.slice(0, 128) ?? null,
      outcome: event.outcome,
      latencyMs: Math.max(
        0,
        Math.min(2_147_483_647, Math.round(event.latencyMs))
      ),
      costMicrounits: event.costMicrounits ?? null,
      errorCode: event.errorCode?.slice(0, 96) ?? null,
    });
  } catch {
    // Observability must not change the result of a learner-facing AI operation.
  }
}
