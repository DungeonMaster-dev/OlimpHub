import { describe, expect, it } from "vitest";
import { buildTrainingRecommendationPlan } from "./trainingRecommendations";

describe("training recommendation plan", () => {
  it("creates an editable handoff and scales bounded duration evidence by selected problems", () => {
    expect(
      buildTrainingRecommendationPlan({
        problemRecommendations: [
          {
            problemId: 4,
            score: 90,
            reasonCode: "unfinished_progress",
            reason: "Paused progress.",
          },
          {
            problemId: 7,
            score: 80,
            reasonCode: "planned_practice",
            reason: "Planned progress.",
          },
        ],
        expectedSolveTime: {
          status: "estimated",
          sampleSize: 3,
          expectedMinutes: 20,
          lowerMinutes: 14,
          upperMinutes: 26,
          reason: "Bounded timing evidence.",
        },
      })
    ).toMatchObject({
      status: "ready",
      creationHandoff: { title: "Recommended practice", problemIds: [4, 7] },
      expectedDuration: {
        status: "estimated",
        expectedMinutes: 40,
        lowerMinutes: 28,
        upperMinutes: 52,
      },
    });
  });

  it("withholds duration and session handoff when evidence does not support them", () => {
    expect(
      buildTrainingRecommendationPlan({
        problemRecommendations: [],
        expectedSolveTime: {
          status: "insufficient_evidence",
          sampleSize: 1,
          expectedMinutes: null,
          lowerMinutes: null,
          upperMinutes: null,
          reason: "Need more completed attempts.",
        },
      })
    ).toMatchObject({
      status: "no_eligible_problems",
      creationHandoff: null,
      expectedDuration: { status: "insufficient_evidence" },
    });
  });
});
