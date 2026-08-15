import { describe, expect, it } from "vitest";
import { buildContestAnalysis } from "../shared/contestAnalysis";

describe("terminal contest analysis", () => {
  it("returns versioned persisted terminal facts without causal or predictive claims", () => {
    expect(
      buildContestAnalysis({
        status: "completed",
        performance: {
          completionPercentage: 100,
          elapsedSeconds: 900,
          elapsedEvidence: "terminal_timestamp",
          completedItems: 2,
          skippedItems: 0,
          unfinishedItems: 0,
          score: { available: true, totalScore: 200, totalPenaltyMinutes: 9 },
        },
        autopsy: {
          available: true,
          terminalOutcome: "all_items_resolved",
          trace: [],
        },
      })
    ).toMatchObject({
      calculationVersion: "contest-analysis-v1",
      available: true,
      facts: {
        completionPercentage: 100,
        elapsedSeconds: 900,
        totalScore: 200,
      },
    });
  });

  it("withholds analysis before a terminal contest state", () => {
    expect(
      buildContestAnalysis({
        status: "active",
        performance: {
          completionPercentage: 0,
          elapsedSeconds: 60,
          elapsedEvidence: "server_observation",
          completedItems: 0,
          skippedItems: 0,
          unfinishedItems: 1,
          score: { available: false, totalScore: 0, totalPenaltyMinutes: 0 },
        },
        autopsy: { available: false, terminalOutcome: null, trace: [] },
      })
    ).toMatchObject({ available: false, reason: "contest_not_terminal" });
  });
});
