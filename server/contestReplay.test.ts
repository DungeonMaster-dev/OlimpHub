import { describe, expect, it } from "vitest";
import { buildContestReplay } from "@shared/contestReplay";

describe("contest replay", () => {
  it("projects terminal autopsy frames read-only without changing their durable status or timing evidence", () => {
    const replay = buildContestReplay({
      status: "completed",
      autopsy: {
        available: true,
        trace: [
          {
            itemId: 11,
            position: 0,
            status: "completed",
            problemId: 8,
            problemTitle: "Traversal",
            completedElapsedSeconds: 510,
            completionEvidence: "recorded",
          },
          {
            itemId: 12,
            position: 1,
            status: "skipped",
            problemId: 9,
            problemTitle: "Paths",
            completedElapsedSeconds: null,
            completionEvidence: "unavailable",
          },
        ],
      },
    });

    expect(replay).toEqual({
      calculationVersion: "contest-replay-v1",
      available: true,
      reason: null,
      frames: [
        {
          frameIndex: 0,
          itemId: 11,
          problemId: 8,
          problemTitle: "Traversal",
          status: "completed",
          completedElapsedSeconds: 510,
          completionEvidence: "recorded",
        },
        {
          frameIndex: 1,
          itemId: 12,
          problemId: 9,
          problemTitle: "Paths",
          status: "skipped",
          completedElapsedSeconds: null,
          completionEvidence: "unavailable",
        },
      ],
    });
    expect(JSON.stringify(replay)).not.toContain("mutate");
    expect(JSON.stringify(replay)).not.toContain("solution");
  });

  it("is unavailable before terminal state even if a caller provides an arbitrary trace", () => {
    expect(
      buildContestReplay({
        status: "active",
        autopsy: {
          available: true,
          trace: [
            {
              itemId: 11,
              position: 0,
              status: "active",
              problemId: 8,
              problemTitle: "Traversal",
              completedElapsedSeconds: null,
              completionEvidence: "unavailable",
            },
          ],
        },
      })
    ).toEqual({
      calculationVersion: "contest-replay-v1",
      available: false,
      reason: "contest_not_terminal",
      frames: [],
    });
  });
});
