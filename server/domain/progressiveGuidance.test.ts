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

  it("withholds revealed solution-like or code-like content in learning mode", () => {
    expect(
      buildProgressiveGuidance({
        highestRevealedLevel: 2,
        hints: [
          { level: 0, content: "Inspect the invariant." },
          { level: 1, content: "Full solution: use this recurrence." },
          { level: 2, content: "```ts\nconst answer = solve();\n```" },
        ],
      })
    ).toMatchObject({
      status: "available",
      guidance: [{ level: 0, content: "Inspect the invariant." }],
      withheldLevels: [1, 2],
    });
  });

  it("returns an explicit blocked state when every revealed hint is solution-like", () => {
    expect(
      buildProgressiveGuidance({
        highestRevealedLevel: 0,
        hints: [{ level: 0, content: "Answer is 42." }],
      })
    ).toMatchObject({
      status: "blocked_for_learning_mode",
      guidance: [],
      withheldLevels: [0],
    });
  });
});
