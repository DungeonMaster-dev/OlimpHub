import { describe, expect, it } from "vitest";
import { buildStructuredUserContext } from "../ai/userContext";
import {
  buildFactualProgressAnalysis,
  progressAnalysisCalculationVersion,
} from "./progressAnalysis";

describe("factual progress analysis", () => {
  it("projects persisted aggregate statuses without inventing a trend or prediction", () => {
    const context = buildStructuredUserContext({
      preferences: {
        timeZone: "UTC",
        weeklyGoal: 4,
        activityTracking: "enabled",
      },
      progress: [
        { status: "solved", count: 3 },
        { status: "in_progress", count: 2 },
        { status: "paused", count: 1 },
        { status: "review", count: 4 },
      ],
      attempts: [{ status: "active", count: 2 }],
      trainingSessions: [{ status: "completed", count: 5 }],
      contestSessions: [{ status: "completed", count: 1 }],
    });

    expect(buildFactualProgressAnalysis(context)).toMatchObject({
      calculationVersion: progressAnalysisCalculationVersion,
      contextVersion: "user-context-v1",
      status: "available",
      evidence: {
        progressRecords: 10,
        attempts: 2,
        trainingSessions: 5,
        contestSessions: 1,
      },
      observations: expect.arrayContaining([
        expect.objectContaining({ code: "solved_progress", count: 3 }),
        expect.objectContaining({ code: "open_progress", count: 3 }),
        expect.objectContaining({
          code: "planned_or_review_progress",
          count: 4,
        }),
        expect.objectContaining({ code: "active_attempts", count: 2 }),
      ]),
    });
  });

  it("returns an explicit insufficient-evidence state when every aggregate is empty", () => {
    const context = buildStructuredUserContext({
      preferences: {
        timeZone: "UTC",
        weeklyGoal: 4,
        activityTracking: "enabled",
      },
      progress: [],
      attempts: [],
      trainingSessions: [],
      contestSessions: [],
    });

    expect(buildFactualProgressAnalysis(context)).toMatchObject({
      status: "insufficient_evidence",
      evidence: {
        progressRecords: 0,
        attempts: 0,
        trainingSessions: 0,
        contestSessions: 0,
      },
    });
  });
});
