import { describe, expect, it } from "vitest";
import { buildProgressiveGuidance } from "./progressiveGuidance";

describe("progressive guidance", () => {
  it("returns only hints at or below the persisted revealed level", () => {
    expect(
      buildProgressiveGuidance({
        highestRevealedLevel: 1,
        hints: [
          { level: 0, content: "Orientation" },
          { level: 1, content: "Strategy" },
          { level: 2, content: "Unrevealed subproblem" },
        ],
      })
    ).toMatchObject({
      calculationVersion: "progressive-guidance-v1",
      status: "available",
      guidance: [
        { level: 0, content: "Orientation" },
        { level: 1, content: "Strategy" },
      ],
    });
  });

  it("returns no guidance before the first approved hint is revealed", () => {
    expect(
      buildProgressiveGuidance({
        highestRevealedLevel: -1,
        hints: [{ level: 0, content: "Unrevealed orientation" }],
      })
    ).toMatchObject({ status: "request_first_hint", guidance: [] });
  });
});
