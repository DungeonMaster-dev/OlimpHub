import { describe, expect, it } from "vitest";
import { buildContestAutopsy } from "@shared/contestAutopsy";

const performance = {
  completionPercentage: 67,
  elapsedSeconds: 630,
  elapsedEvidence: "terminal_timestamp",
  score: {
    calculationVersion: "completion-time-v1",
    available: true,
    totalScore: 100,
    totalPenaltyMinutes: 8,
  },
};

describe("Contest Autopsy", () => {
  it("builds an ordered factual terminal trace with only valid persisted completion timing", () => {
    const autopsy = buildContestAutopsy({
      status: "completed",
      startedAt: new Date("2026-08-15T09:00:00.000Z"),
      performance,
      items: [
        {
          id: 12,
          position: 1,
          status: "skipped",
          completedAt: null,
          problemId: 9,
          problemTitle: "Second",
        },
        {
          id: 11,
          position: 0,
          status: "completed",
          completedAt: new Date("2026-08-15T09:08:30.000Z"),
          problemId: 8,
          problemTitle: "First",
        },
      ],
    });

    expect(autopsy).toMatchObject({
      calculationVersion: "contest-autopsy-v1",
      available: true,
      terminalOutcome: "all_items_resolved",
      summary: {
        completionPercentage: 67,
        totalScore: 100,
        totalPenaltyMinutes: 8,
      },
      trace: [
        {
          position: 0,
          status: "completed",
          problemId: 8,
          completedElapsedSeconds: 510,
          completionEvidence: "recorded",
        },
        {
          position: 1,
          status: "skipped",
          problemId: 9,
          completedElapsedSeconds: null,
          completionEvidence: "unavailable",
        },
      ],
    });
    expect(JSON.stringify(autopsy)).not.toContain("mistake");
    expect(JSON.stringify(autopsy)).not.toContain("rank");
  });

  it("uses a deadline-expired outcome and refuses a premature review for non-terminal sessions", () => {
    const expired = buildContestAutopsy({
      status: "expired",
      startedAt: new Date("2026-08-15T09:00:00.000Z"),
      performance,
      items: [
        {
          id: 11,
          position: 0,
          status: "active",
          completedAt: null,
          problemId: 8,
          problemTitle: "First",
        },
      ],
    });
    const active = buildContestAutopsy({
      status: "active",
      startedAt: new Date("2026-08-15T09:00:00.000Z"),
      performance,
      items: [],
    });

    expect(expired).toMatchObject({
      available: true,
      terminalOutcome: "deadline_expired",
      trace: [{ status: "active", completionEvidence: "unavailable" }],
    });
    expect(active).toEqual({
      calculationVersion: "contest-autopsy-v1",
      available: false,
      reason: "contest_not_terminal",
      terminalOutcome: null,
      trace: [],
      summary: null,
    });
  });
});
