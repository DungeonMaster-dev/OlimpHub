// @vitest-environment jsdom

import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  completedSession: false,
  expiredSession: false,
  invalidate: vi.fn(),
  update: vi.fn(),
}));

vi.mock("wouter", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
  useRoute: () => [true, { id: "701" }],
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      olimp: { contests: { detail: { invalidate: mocks.invalidate } } },
    }),
    olimp: {
      contests: {
        detail: {
          useQuery: () => ({
            isLoading: false,
            error: null,
            data: {
              session: {
                id: 701,
                title: "Graph and combinatorics",
                status: mocks.completedSession
                  ? "completed"
                  : mocks.expiredSession
                    ? "expired"
                    : "active",
              },
              timer: {
                durationMinutes: 120,
                expiresAt: new Date(Date.now() + 7_200_000),
                remainingSeconds: 7_200,
                isExpired: mocks.expiredSession,
              },
              scoring: {
                calculationVersion: "completion-time-v1",
                available: true,
                reason: null,
                completedItems: mocks.completedSession ? 1 : 0,
                unscoredCompletedItems: 0,
                totalScore: mocks.completedSession ? 100 : 0,
                totalPenaltyMinutes: mocks.completedSession ? 12 : 0,
              },
              performance: {
                calculationVersion: "contest-performance-v1",
                status: mocks.completedSession
                  ? "completed"
                  : mocks.expiredSession
                    ? "expired"
                    : "active",
                totalItems: 2,
                completedItems: mocks.completedSession ? 1 : 0,
                skippedItems: mocks.completedSession ? 1 : 0,
                unfinishedItems: mocks.completedSession ? 0 : 2,
                completionPercentage: mocks.completedSession ? 100 : 0,
                elapsedSeconds: mocks.completedSession
                  ? 630
                  : mocks.expiredSession
                    ? 7_200
                    : 60,
                elapsedEvidence:
                  mocks.completedSession || mocks.expiredSession
                    ? "terminal_timestamp"
                    : "server_observation",
                validTimedCompletedItems: mocks.completedSession ? 1 : 0,
                unavailableTimedCompletedItems: 0,
                score: {
                  calculationVersion: "completion-time-v1",
                  available: true,
                  completedItems: mocks.completedSession ? 1 : 0,
                  unscoredCompletedItems: 0,
                  totalScore: mocks.completedSession ? 100 : 0,
                  totalPenaltyMinutes: mocks.completedSession ? 12 : 0,
                },
              },
              autopsy:
                mocks.completedSession || mocks.expiredSession
                  ? {
                      calculationVersion: "contest-autopsy-v1",
                      available: true,
                      reason: null,
                      terminalOutcome: mocks.completedSession
                        ? "all_items_resolved"
                        : "deadline_expired",
                      trace: [
                        {
                          itemId: 11,
                          position: 0,
                          status: mocks.completedSession
                            ? "completed"
                            : "active",
                          problemId: 8,
                          problemTitle: "Traversal",
                          completedElapsedSeconds: mocks.completedSession
                            ? 510
                            : null,
                          completionEvidence: mocks.completedSession
                            ? "recorded"
                            : "unavailable",
                        },
                        {
                          itemId: 12,
                          position: 1,
                          status: mocks.completedSession ? "skipped" : "queued",
                          problemId: 9,
                          problemTitle: "Paths",
                          completedElapsedSeconds: null,
                          completionEvidence: "unavailable",
                        },
                      ],
                      summary: {
                        completionPercentage: mocks.completedSession ? 100 : 0,
                        elapsedSeconds: mocks.completedSession ? 630 : 7_200,
                        elapsedEvidence: "terminal_timestamp",
                        totalScore: mocks.completedSession ? 100 : 0,
                        totalPenaltyMinutes: mocks.completedSession ? 12 : 0,
                        scoringAvailable: true,
                      },
                    }
                  : {
                      calculationVersion: "contest-autopsy-v1",
                      available: false,
                      reason: "contest_not_terminal",
                      terminalOutcome: null,
                      trace: [],
                      summary: null,
                    },
              replay:
                mocks.completedSession || mocks.expiredSession
                  ? {
                      calculationVersion: "contest-replay-v1",
                      available: true,
                      reason: null,
                      frames: [
                        {
                          frameIndex: 0,
                          itemId: 11,
                          problemId: 8,
                          problemTitle: "Traversal",
                          status: mocks.completedSession
                            ? "completed"
                            : "active",
                          completedElapsedSeconds: mocks.completedSession
                            ? 510
                            : null,
                          completionEvidence: mocks.completedSession
                            ? "recorded"
                            : "unavailable",
                        },
                        {
                          frameIndex: 1,
                          itemId: 12,
                          problemId: 9,
                          problemTitle: "Paths",
                          status: mocks.completedSession ? "skipped" : "queued",
                          completedElapsedSeconds: null,
                          completionEvidence: "unavailable",
                        },
                      ],
                    }
                  : {
                      calculationVersion: "contest-replay-v1",
                      available: false,
                      reason: "contest_not_terminal",
                      frames: [],
                    },
              items: [
                {
                  item: {
                    id: 11,
                    position: 0,
                    status: mocks.completedSession ? "completed" : "active",
                  },
                  problem: {
                    id: 8,
                    title: "Traversal",
                    sourceId: "codeforces",
                    sourceUrl: "https://codeforces.com/problemset/problem/1/A",
                    difficulty: 900,
                    tags: ["graphs"],
                  },
                },
                {
                  item: {
                    id: 12,
                    position: 1,
                    status: mocks.completedSession ? "skipped" : "queued",
                  },
                  problem: {
                    id: 9,
                    title: "Paths",
                    sourceId: "codeforces",
                    sourceUrl: "https://codeforces.com/problemset/problem/2/A",
                    difficulty: 1100,
                    tags: ["graphs"],
                  },
                },
              ],
            },
          }),
        },
        updateItem: {
          useMutation: (options: { onSuccess: () => void }) => ({
            isPending: false,
            mutate: (input: unknown) => {
              mocks.update(input);
              options.onSuccess();
            },
          }),
        },
      },
    },
  },
}));

import ContestSession from "../client/src/pages/ContestSession";

describe("contest session lifecycle UI", () => {
  afterEach(() => {
    cleanup();
    mocks.completedSession = false;
    mocks.expiredSession = false;
    mocks.update.mockReset();
    mocks.invalidate.mockReset();
  });

  it("requests one terminal completion for the active contest item and leaves promotion to the protected server", async () => {
    const screen = render(<ContestSession />);
    fireEvent.click(screen.getByRole("button", { name: "Complete item" }));

    await waitFor(() =>
      expect(mocks.update).toHaveBeenNthCalledWith(1, {
        sessionId: 701,
        itemId: 11,
        status: "completed",
      })
    );
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.invalidate).toHaveBeenCalledWith({ sessionId: 701 });
    expect(screen.getByText("TIME REMAINING")).toBeTruthy();
    expect(screen.getByText("02:00:00")).toBeTruthy();
    expect(screen.getByText("FACTUAL SCORE")).toBeTruthy();
    expect(screen.getByText("completion-time-v1")).toBeTruthy();
  });

  it("renders only a factual completed-session sequence summary", () => {
    mocks.completedSession = true;
    const screen = render(<ContestSession />);

    expect(screen.getByText("SESSION COMPLETE")).toBeTruthy();
    expect(screen.getByText("COMPLETED")).toBeTruthy();
    expect(screen.getByText("SKIPPED")).toBeTruthy();
    expect(screen.getAllByText("100%")).not.toHaveLength(0);
    expect(screen.getByText("100")).toBeTruthy();
    expect(screen.getByText("12 min")).toBeTruthy();
    expect(screen.getByText("CONTEST FACTS")).toBeTruthy();
    expect(screen.getByText("00:10:30")).toBeTruthy();
    expect(screen.getByText("Terminal timestamp")).toBeTruthy();
    expect(screen.getByText("CONTEST AUTOPSY")).toBeTruthy();
    expect(screen.getByText("All items resolved")).toBeTruthy();
    expect(screen.getAllByText("00:08:30")).not.toHaveLength(0);
    expect(screen.getAllByText(/does not infer rank/i)).not.toHaveLength(0);
    expect(screen.getByText("READ-ONLY REPLAY")).toBeTruthy();
    expect(screen.getByText("Replay frame 1 of 2")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Next replay frame" }));
    expect(screen.getByText("Replay frame 2 of 2")).toBeTruthy();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("renders the server-materialized expiration state instead of allowing another advance", () => {
    mocks.expiredSession = true;
    const screen = render(<ContestSession />);

    expect(screen.getByText("TIME EXPIRED")).toBeTruthy();
    expect(screen.getByText("CONTEST FACTS")).toBeTruthy();
    expect(screen.getByText("CONTEST AUTOPSY")).toBeTruthy();
    expect(screen.getByText("READ-ONLY REPLAY")).toBeTruthy();
    expect(screen.getByText("Deadline expired")).toBeTruthy();
    expect(screen.getAllByText("02:00:00")).not.toHaveLength(0);
    expect(screen.queryByRole("button", { name: "Complete item" })).toBeNull();
  });
});
