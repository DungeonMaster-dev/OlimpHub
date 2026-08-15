import { describe, expect, it } from "vitest";
import { isTrainingSessionComplete } from "./trainingActivity";

describe("training activity lifecycle", () => {
  it("completes only when every existing item reaches a terminal state", () => {
    expect(isTrainingSessionComplete([])).toBe(false);
    expect(isTrainingSessionComplete(["completed", "queued"])).toBe(false);
    expect(isTrainingSessionComplete(["completed", "skipped"])).toBe(true);
  });
});
