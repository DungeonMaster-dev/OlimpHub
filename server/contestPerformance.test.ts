import { describe, expect, it } from "vitest";
import { summarizeContestPerformance } from "@shared/contestPerformance";

const scoring = {
  calculationVersion: "completion-time-v1",
  available: true,
  completedItems: 1,
  unscoredCompletedItems: 0,
  totalScore: 100,
  totalPenaltyMinutes: 8,
};

describe("contest performance analysis", () => {
  it("summarizes a completed contest from persisted terminal timestamps and item outcomes", () => {
    const summary = summarizeContestPerformance({
      status: "completed",
      startedAt: new Date("2026-08-15T09:00:00.000Z"),
      completedAt: new Date("2026-08-15T09:10:30.000Z"),
      expiresAt: new Date("2026-08-15T11:00:00.000Z"),
      observedAt: new Date("2026-08-15T12:00:00.000Z"),
      items: [
        {
          status: "completed",
          completedAt: new Date("2026-08-15T09:08:00.000Z"),
        },
        { status: "skipped", completedAt: null },
        { status: "queued", completedAt: null },
      ],
      scoring,
    });

    expect(summary).toMatchObject({
      calculationVersion: "contest-performance-v1",
      completedItems: 1,
      skippedItems: 1,
      unfinishedItems: 1,
      completionPercentage: 67,
      elapsedSeconds: 630,
      elapsedEvidence: "terminal_timestamp",
      validTimedCompletedItems: 1,
      unavailableTimedCompletedItems: 0,
      score: scoring,
    });
    expect(JSON.stringify(summary)).not.toContain("rank");
    expect(JSON.stringify(summary)).not.toContain("rating");
  });

  it("uses the persisted deadline for expiry and reports unavailable evidence without inventing a duration", () => {
    const expired = summarizeContestPerformance({
      status: "expired",
      startedAt: new Date("2026-08-15T09:00:00.000Z"),
      completedAt: null,
      expiresAt: new Date("2026-08-15T10:00:00.000Z"),
      observedAt: new Date("2026-08-15T12:00:00.000Z"),
      items: [{ status: "active", completedAt: null }],
      scoring: { ...scoring, completedItems: 0, totalScore: 0 },
    });
    const draft = summarizeContestPerformance({
      status: "draft",
      startedAt: null,
      completedAt: null,
      expiresAt: null,
      observedAt: new Date("2026-08-15T12:00:00.000Z"),
      items: [{ status: "queued", completedAt: null }],
      scoring: {
        ...scoring,
        available: false,
        completedItems: 0,
        totalScore: 0,
      },
    });

    expect(expired).toMatchObject({
      elapsedSeconds: 3600,
      elapsedEvidence: "terminal_timestamp",
      completionPercentage: 0,
    });
    expect(draft).toMatchObject({
      elapsedSeconds: null,
      elapsedEvidence: "unavailable",
      validTimedCompletedItems: 0,
    });
  });
});
