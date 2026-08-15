import { describe, expect, it } from "vitest";
import { summarizeContestScore } from "./contestScoring";

describe("contest score projection", () => {
  it("projects fixed completed-item points and rounded-up elapsed-minute penalties from persisted facts", () => {
    const summary = summarizeContestScore({
      startedAt: new Date("2026-08-15T09:00:00.000Z"),
      items: [
        {
          status: "completed",
          completedAt: new Date("2026-08-15T09:00:01.000Z"),
        },
        {
          status: "completed",
          completedAt: new Date("2026-08-15T09:25:00.000Z"),
        },
        { status: "skipped", completedAt: null },
        { status: "queued", completedAt: null },
      ],
    });

    expect(summary).toEqual({
      calculationVersion: "completion-time-v1",
      available: true,
      reason: null,
      completedItems: 2,
      unscoredCompletedItems: 0,
      totalScore: 200,
      totalPenaltyMinutes: 26,
    });
  });

  it("reports incomplete completion evidence instead of inventing points, penalties or wrong-attempt factors", () => {
    const summary = summarizeContestScore({
      startedAt: new Date("2026-08-15T09:00:00.000Z"),
      items: [
        { status: "completed", completedAt: null },
        {
          status: "completed",
          completedAt: new Date("2026-08-15T08:59:59.000Z"),
        },
      ],
    });

    expect(summary).toMatchObject({
      completedItems: 0,
      unscoredCompletedItems: 2,
      totalScore: 0,
      totalPenaltyMinutes: 0,
    });
    expect(JSON.stringify(summary)).not.toContain("wrongAttempt");
  });

  it("does not offer a score before a contest has a durable start instant", () => {
    expect(
      summarizeContestScore({
        startedAt: null,
        items: [{ status: "completed", completedAt: new Date() }],
      })
    ).toMatchObject({
      available: false,
      reason: "contest_not_started",
      totalScore: 0,
      totalPenaltyMinutes: 0,
    });
  });
});
