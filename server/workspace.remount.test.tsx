// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  recordPageActivity: vi.fn(),
  recordEditorActivity: vi.fn(),
  sequence: 0,
}));

vi.mock("wouter", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  useRoute: () => [true, { id: "9" }],
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      olimp: {
        catalogue: { detail: { invalidate: vi.fn() } },
        workspace: { notes: { invalidate: vi.fn() } },
      },
    }),
    olimp: {
      catalogue: {
        detail: {
          useQuery: () => ({
            data: {
              problem: {
                id: 9,
                sourceId: "codeforces",
                difficulty: 1200,
                title: "Two Sum",
                tags: ["implementation"],
                sourceUrl: "https://codeforces.com/problemset/problem/1/A",
              },
              progress: null,
              skills: [],
            },
            isLoading: false,
            error: null,
          }),
        },
      },
      workspace: {
        start: {
          useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
        },
        recordPageActivity: {
          useMutation: () => ({ mutate: mocks.recordPageActivity }),
        },
        recordEditorActivity: {
          useMutation: () => ({ mutate: mocks.recordEditorActivity }),
        },
        notes: {
          useQuery: () => ({ data: [], isLoading: false, error: null }),
        },
        saveNote: {
          useMutation: () => ({ mutate: vi.fn(), isPending: false }),
        },
        setAttemptState: {
          useMutation: () => ({ mutate: vi.fn(), isPending: false }),
        },
        setStatus: {
          useMutation: () => ({ mutate: vi.fn(), isPending: false }),
        },
        nextHint: {
          useMutation: () => ({ mutate: vi.fn(), isPending: false }),
        },
      },
    },
  },
}));

import Workspace from "../client/src/pages/Workspace";

describe("Workspace page activity lifecycle", () => {
  beforeEach(() => {
    mocks.recordPageActivity.mockReset();
    mocks.recordEditorActivity.mockReset();
    mocks.sequence = 0;
    vi.stubGlobal("crypto", {
      randomUUID: () =>
        `00000000-0000-4000-8000-${String(++mocks.sequence).padStart(12, "0")}`,
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("emits one page-view mutation on mount and exactly one new mutation on revisit", async () => {
    const firstVisit = render(<Workspace />);
    await waitFor(() =>
      expect(mocks.recordPageActivity).toHaveBeenCalledTimes(1)
    );
    firstVisit.unmount();

    render(<Workspace />);
    await waitFor(() =>
      expect(mocks.recordPageActivity).toHaveBeenCalledTimes(2)
    );
    expect(mocks.recordPageActivity.mock.calls).toEqual([
      [
        expect.objectContaining({
          problemId: 9,
          clientEventId: "00000000-0000-4000-8000-000000000001",
        }),
      ],
      [
        expect.objectContaining({
          problemId: 9,
          clientEventId: "00000000-0000-4000-8000-000000000002",
        }),
      ],
    ]);
  });

  it("emits metadata-only focus and blur mutations from the private note editor", async () => {
    const screen = render(<Workspace />);
    const editor = screen.getByPlaceholderText(
      "What have you tried? Which invariant or edge case is still unclear?"
    );
    fireEvent.focus(editor);
    fireEvent.blur(editor);

    await waitFor(() =>
      expect(mocks.recordEditorActivity).toHaveBeenCalledTimes(2)
    );
    expect(mocks.recordEditorActivity.mock.calls).toEqual([
      [
        expect.objectContaining({
          problemId: 9,
          phase: "focused",
          clientEventId: "00000000-0000-4000-8000-000000000002",
        }),
      ],
      [
        expect.objectContaining({
          problemId: 9,
          phase: "blurred",
          clientEventId: "00000000-0000-4000-8000-000000000003",
        }),
      ],
    ]);
    expect(JSON.stringify(mocks.recordEditorActivity.mock.calls)).not.toContain(
      "private note"
    );
  });

  it("emits bounded active then idle phases while the editor stays focused without recording note text", async () => {
    vi.useFakeTimers();
    const screen = render(<Workspace />);
    const editor = screen.getByPlaceholderText(
      "What have you tried? Which invariant or edge case is still unclear?"
    );
    fireEvent.focus(editor);

    act(() => vi.advanceTimersByTime(60_000));
    act(() => vi.advanceTimersByTime(60_000));

    expect(mocks.recordEditorActivity.mock.calls).toEqual([
      [expect.objectContaining({ phase: "focused" })],
      [expect.objectContaining({ phase: "active" })],
      [expect.objectContaining({ phase: "idle" })],
    ]);
    expect(JSON.stringify(mocks.recordEditorActivity.mock.calls)).not.toContain(
      "private note"
    );
    vi.useRealTimers();
  });
});
