// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  adaptiveRecommendations: [] as Array<{
    problem: { id: number; title: string; difficulty: number | null };
    reason: string;
  }>,
  adaptiveProgression: {
    status: "insufficient_evidence",
    targetDifficulty: null as number | null,
    minDifficulty: null as number | null,
    maxDifficulty: null as number | null,
    reason:
      "Need 3 recent solved problems with verified difficulty before setting a progression target.",
  },
  adaptiveExpectedSolveTime: {
    status: "insufficient_evidence",
    expectedMinutes: null as number | null,
    lowerMinutes: null as number | null,
    upperMinutes: null as number | null,
    reason:
      "Need 3 completed attempts with bounded elapsed time before estimating solve time.",
  },
  catalogueQuery: vi.fn(),
  create: vi.fn(),
  invalidate: vi.fn(),
  sessions: [] as Array<{
    id: number;
    title: string;
    status: "active";
    createdAt: Date;
  }>,
}));

vi.mock("wouter", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      olimp: { training: { list: { invalidate: mocks.invalidate } } },
    }),
    olimp: {
      catalogue: {
        list: {
          useQuery: mocks.catalogueQuery,
        },
      },
      training: {
        adaptive: {
          useQuery: () => ({
            data: {
              progression: mocks.adaptiveProgression,
              expectedSolveTime: mocks.adaptiveExpectedSolveTime,
              recommendations: mocks.adaptiveRecommendations,
            },
          }),
        },
        list: {
          useQuery: () => ({
            data: mocks.sessions,
            isLoading: false,
            error: null,
          }),
        },
        create: {
          useMutation: (options: { onSuccess: () => void }) => ({
            isPending: false,
            mutate: (input: unknown) => {
              mocks.create(input);
              options.onSuccess();
            },
          }),
        },
      },
    },
  },
}));

import Training from "../client/src/pages/Training";

describe("manual training creation UI", () => {
  beforeEach(() => {
    mocks.adaptiveRecommendations = [];
    mocks.adaptiveProgression = {
      status: "insufficient_evidence",
      targetDifficulty: null,
      minDifficulty: null,
      maxDifficulty: null,
      reason:
        "Need 3 recent solved problems with verified difficulty before setting a progression target.",
    };
    mocks.adaptiveExpectedSolveTime = {
      status: "insufficient_evidence",
      expectedMinutes: null,
      lowerMinutes: null,
      upperMinutes: null,
      reason:
        "Need 3 completed attempts with bounded elapsed time before estimating solve time.",
    };
    mocks.catalogueQuery.mockReset();
    mocks.catalogueQuery.mockReturnValue({
      data: {
        items: [
          { problem: { id: 8, title: "Two Sum", difficulty: 800 } },
          {
            problem: {
              id: 13,
              title: "Graph traversal",
              difficulty: 1200,
            },
          },
        ],
      },
    });
    mocks.create.mockReset();
    mocks.invalidate.mockReset();
    mocks.sessions = [];
    vi.stubGlobal("crypto", {
      randomUUID: () => "e2661a3e-ef4d-4f8a-9fcd-3dc54ab73e04",
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("submits selected imported problems and surfaces the created active session", async () => {
    const screen = render(<Training />);

    expect(mocks.catalogueQuery).toHaveBeenCalledWith({ page: 0, pageSize: 8 });

    fireEvent.change(screen.getByLabelText("Session title"), {
      target: { value: "Graph foundations" },
    });
    const [firstProblem, secondProblem] = screen.getAllByRole("checkbox");
    fireEvent.click(firstProblem!);
    fireEvent.click(secondProblem!);
    fireEvent.click(screen.getByRole("button", { name: "Create session" }));

    await waitFor(() =>
      expect(mocks.create).toHaveBeenCalledWith({
        title: "Graph foundations",
        problemIds: [8, 13],
        requestId: "e2661a3e-ef4d-4f8a-9fcd-3dc54ab73e04",
      })
    );
    expect(mocks.invalidate).toHaveBeenCalledTimes(1);

    mocks.sessions = [
      {
        id: 701,
        title: "Graph foundations",
        status: "active",
        createdAt: new Date("2026-08-15T00:00:00.000Z"),
      },
    ];
    screen.rerender(<Training />);

    expect(screen.getByText("Graph foundations")).toBeTruthy();
    expect(
      (
        screen.getByRole("link", {
          name: /Graph foundations/,
        }) as HTMLAnchorElement
      ).getAttribute("href")
    ).toBe("/training/701");
  });

  it("lets a user review adaptive reasons and apply the suggested imported problems before creating a session", async () => {
    mocks.adaptiveRecommendations = [
      {
        problem: { id: 8, title: "Two Sum", difficulty: 800 },
        reason:
          "Prioritized because your personal progress still has an unfinished attempt.",
      },
      {
        problem: { id: 13, title: "Graph traversal", difficulty: 1200 },
        reason:
          "Prioritized because you explicitly marked this problem for practice.",
      },
    ];
    mocks.adaptiveProgression = {
      status: "estimated",
      targetDifficulty: 1300,
      minDifficulty: 1100,
      maxDifficulty: 1500,
      reason:
        "Target is one verified difficulty step above the median of your 3 most recent solved problems.",
    };
    mocks.adaptiveExpectedSolveTime = {
      status: "estimated",
      expectedMinutes: 20,
      lowerMinutes: 14,
      upperMinutes: 26,
      reason:
        "Estimate is the median elapsed time across your 3 recent completed attempts with bounded duration.",
    };
    const screen = render(<Training />);

    expect(
      screen.getByText(
        "Prioritized because your personal progress still has an unfinished attempt."
      )
    ).toBeTruthy();
    expect(
      screen.getByText("Target difficulty 1300 (range 1100–1500).")
    ).toBeTruthy();
    expect(
      screen.getByText("Expected solve time 20 min (typical range 14–26 min).")
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Use suggestions" }));

    expect(screen.getByDisplayValue("Adaptive practice")).toBeTruthy();
    for (const checkbox of screen.getAllByRole("checkbox")) {
      expect((checkbox as HTMLInputElement).checked).toBe(true);
    }
    fireEvent.click(screen.getByRole("button", { name: "Create session" }));

    await waitFor(() =>
      expect(mocks.create).toHaveBeenCalledWith({
        title: "Adaptive practice",
        problemIds: [8, 13],
        requestId: "e2661a3e-ef4d-4f8a-9fcd-3dc54ab73e04",
      })
    );
  });
});
