import { describe, expect, it } from "vitest";
import {
  buildProblemRecommendationProjection,
  problemRecommendationCalculationVersion,
} from "./problemRecommendations";

describe("dedicated problem recommendations", () => {
  it("prioritizes real unfinished owner work and excludes terminal or active-session candidates", () => {
    const result = buildProblemRecommendationProjection({
      candidates: [
        {
          problemId: 1,
          difficulty: 800,
          progressStatus: "solved",
          availability: "eligible",
        },
        {
          problemId: 2,
          difficulty: 1500,
          progressStatus: "paused",
          availability: "eligible",
        },
        {
          problemId: 3,
          difficulty: 1300,
          progressStatus: "planned",
          availability: "eligible",
        },
        {
          problemId: 4,
          difficulty: 1300,
          progressStatus: null,
          availability: "active_training",
        },
        {
          problemId: 5,
          difficulty: 1300,
          progressStatus: null,
          availability: "active_contest",
        },
        {
          problemId: 6,
          difficulty: 1300,
          progressStatus: null,
          availability: "eligible",
        },
      ],
      solvedDifficulties: [1200, 1400, 1000],
      count: 4,
    });

    expect(result).toMatchObject({
      calculationVersion: problemRecommendationCalculationVersion,
      status: "ready",
      progression: { status: "estimated", targetDifficulty: 1300 },
      exclusions: expect.arrayContaining([
        "solved_skipped_or_archived_progress",
        "active_training_assignment",
        "active_contest_assignment",
      ]),
    });
    expect(result.recommendations).toEqual([
      expect.objectContaining({
        problemId: 2,
        reasonCode: "unfinished_progress",
      }),
      expect.objectContaining({
        problemId: 3,
        reasonCode: "planned_practice",
      }),
      expect.objectContaining({
        problemId: 6,
        reasonCode: "catalogue_fallback",
      }),
    ]);
  });

  it("reports insufficient catalogue explicitly instead of fabricating a recommendation", () => {
    expect(
      buildProblemRecommendationProjection({
        candidates: [],
        solvedDifficulties: [],
        count: 4,
      })
    ).toMatchObject({
      status: "insufficient_catalogue",
      recommendations: [],
    });
  });
});
