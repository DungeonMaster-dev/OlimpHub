import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  values: vi.fn().mockResolvedValue(undefined),
  getDb: vi.fn(),
}));

vi.mock("../db", () => ({ getDb: mocks.getDb }));
vi.mock("../../drizzle/schema", () => ({ aiObservabilityEvents: {} }));

import { recordAiObservability } from "./observability";

describe("AI observability writer", () => {
  it("persists only permitted metadata and represents unavailable cost as null", async () => {
    mocks.values.mockClear();
    mocks.getDb.mockResolvedValue({
      insert: () => ({ values: mocks.values }),
    });

    await recordAiObservability({
      userId: 7,
      operation: "contest_draft",
      model: "claude-haiku-4-5",
      outcome: "succeeded",
      latencyMs: 42.8,
    });

    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 7,
        operation: "contest_draft",
        model: "claude-haiku-4-5",
        outcome: "succeeded",
        latencyMs: 43,
        costMicrounits: null,
      })
    );
    expect(mocks.values.mock.calls[0][0]).not.toHaveProperty("prompt");
    expect(mocks.values.mock.calls[0][0]).not.toHaveProperty("response");
  });

  it("does not disrupt a learner-facing operation if telemetry persistence fails", async () => {
    mocks.getDb.mockRejectedValueOnce(new Error("database unavailable"));
    await expect(
      recordAiObservability({
        userId: 7,
        operation: "contest_draft",
        outcome: "failed",
        latencyMs: 1,
        errorCode: "invalid_json",
      })
    ).resolves.toBeUndefined();
  });
});
