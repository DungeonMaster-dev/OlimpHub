import { describe, expect, it } from "vitest";
import { createActivityEventId } from "./idempotency";

describe("activity idempotency key", () => {
  it("is stable for the same logical personal event", () => {
    const input = {
      userId: 7,
      eventType: "attempt_started",
      attemptId: 11,
      problemId: 3,
      metadata: { source: "workspace" },
    };
    expect(createActivityEventId(input)).toBe(createActivityEventId(input));
  });

  it("separates different logical events", () => {
    expect(
      createActivityEventId({
        userId: 7,
        eventType: "attempt_started",
        attemptId: 11,
        problemId: 3,
      })
    ).not.toBe(
      createActivityEventId({
        userId: 7,
        eventType: "attempt_paused",
        attemptId: 11,
        problemId: 3,
      })
    );
  });
});
