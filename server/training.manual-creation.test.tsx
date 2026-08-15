// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
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
});
