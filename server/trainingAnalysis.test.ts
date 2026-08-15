import { describe, expect, it } from "vitest";
import { summarizeTrainingOutcomes } from "../shared/trainingAnalysis";

describe("post-training outcome analysis", () => {
  it("summarizes persisted terminal and unresolved session item facts without inferring performance", () => {
    expect(
      summarizeTrainingOutcomes(["completed", "completed", "skipped", "queued"])
    ).toEqual({
      total: 4,
      completed: 2,
      skipped: 1,
      unresolved: 1,
      completionRate: 50,
    });
  });

  it("keeps empty sessions explicitly non-rateable", () => {
    expect(summarizeTrainingOutcomes([])).toEqual({
      total: 0,
      completed: 0,
      skipped: 0,
      unresolved: 0,
      completionRate: null,
    });
  });
});
