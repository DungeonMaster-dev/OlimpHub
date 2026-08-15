// @vitest-environment jsdom

import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  completedSession: false,
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
      olimp: { training: { detail: { invalidate: mocks.invalidate } } },
    }),
    olimp: {
      training: {
        detail: {
          useQuery: () => ({
            isLoading: false,
            error: null,
            data: {
              session: {
                id: 701,
                title: "Graph practice",
                status: mocks.completedSession ? "completed" : "active",
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
            mutateAsync: async (input: unknown) => {
              mocks.update(input);
              options.onSuccess();
              return { success: true };
            },
          }),
        },
      },
    },
  },
}));

import TrainingSession from "../client/src/pages/TrainingSession";

describe("training session lifecycle UI", () => {
  afterEach(() => {
    cleanup();
    mocks.completedSession = false;
    mocks.update.mockReset();
    mocks.invalidate.mockReset();
  });

  it("requests completion only for the active item, leaving ordered promotion to the protected server lifecycle", async () => {
    const screen = render(<TrainingSession />);
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
  });

  it("renders a factual completed-session analysis from persisted item statuses", () => {
    mocks.completedSession = true;
    const screen = render(<TrainingSession />);

    expect(screen.getByText("SESSION COMPLETE")).toBeTruthy();
    expect(screen.getByText("COMPLETED")).toBeTruthy();
    expect(screen.getByText("SKIPPED")).toBeTruthy();
    expect(screen.getByText("50%")).toBeTruthy();
  });
});
