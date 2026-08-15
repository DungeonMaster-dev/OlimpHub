// @vitest-environment jsdom

import { cleanup, fireEvent, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  invalidate: vi.fn(),
}));

vi.mock("wouter", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      olimp: { contests: { list: { invalidate: mocks.invalidate } } },
    }),
    olimp: {
      catalogue: {
        list: {
          useQuery: () => ({
            data: {
              items: [
                { problem: { id: 2, title: "Paused graph", difficulty: 1500 } },
                { problem: { id: 4, title: "Catalogue DP", difficulty: 1000 } },
                { problem: { id: 5, title: "Manual extra", difficulty: 1200 } },
              ],
            },
          }),
        },
      },
      contests: {
        suggest: {
          useQuery: () => ({
            isLoading: false,
            data: {
              recommendations: [
                {
                  problem: { id: 2, title: "Paused graph" },
                  reason:
                    "Included because your personal progress has unfinished work on this problem.",
                },
                {
                  problem: { id: 4, title: "Catalogue DP" },
                  reason:
                    "Included from available catalogue problems because no higher-priority owner-scoped evidence applies.",
                },
              ],
            },
          }),
        },
        list: { useQuery: () => ({ data: [] }) },
        create: {
          useMutation: () => ({
            isPending: false,
            mutate: mocks.create,
          }),
        },
        start: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
      },
    },
  },
}));

import Contests from "../client/src/pages/Contests";

describe("contest selection UI", () => {
  afterEach(() => {
    cleanup();
    mocks.create.mockReset();
    mocks.invalidate.mockReset();
  });

  it("copies protected suggestions into the editable catalogue form only after explicit action", () => {
    const screen = render(<Contests />);
    const checkboxes = screen.getAllByRole("checkbox") as HTMLInputElement[];

    expect(screen.getByText("SUGGESTED START")).toBeTruthy();
    expect(screen.getByText(/unfinished work on this problem/i)).toBeTruthy();
    expect(checkboxes[0]!.checked).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Use suggested set" }));

    expect(checkboxes[0]!.checked).toBe(true);
    expect(checkboxes[1]!.checked).toBe(true);
    expect(checkboxes[2]!.checked).toBe(false);
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
