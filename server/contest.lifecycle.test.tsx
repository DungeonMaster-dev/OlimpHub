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
    expect(screen.getByText("100%")).toBeTruthy();
    expect(screen.getByText("100")).toBeTruthy();
    expect(screen.getByText("12 min")).toBeTruthy();
    expect(screen.queryByText(/rank/i)).toBeNull();
    expect(screen.getByText(/does not infer performance/i)).toBeTruthy();
  });

  it("renders the server-materialized expiration state instead of allowing another advance", () => {
    mocks.expiredSession = true;
    const screen = render(<ContestSession />);

    expect(screen.getByText("TIME EXPIRED")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Complete item" })).toBeNull();
  });
});
