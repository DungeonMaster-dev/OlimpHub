// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  query: {
    data: [] as
      | Array<{
          operation: string;
          model: string | null;
          outcome: "succeeded" | "failed";
          latencyMs: number;
          costMicrounits: number | null;
          errorCode: string | null;
          occurredAt: Date;
        }>
      | undefined,
    isLoading: false,
    error: null as Error | null,
  },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: { olimp: { ai: { observability: { useQuery: () => mocks.query } } } },
}));

import { AIObservabilityPreview } from "../client/src/pages/Settings";

describe("AI observability settings preview", () => {
  afterEach(cleanup);

  it("renders recent metadata without prompt or response content", () => {
    mocks.query = {
      data: [
        {
          operation: "contest_draft",
          model: "claude-haiku-4-5",
          outcome: "failed",
          latencyMs: 182,
          costMicrounits: null,
          errorCode: "invalid_json",
          occurredAt: new Date("2026-08-15T10:00:00.000Z"),
        },
      ],
      isLoading: false,
      error: null,
    };
    const screen = render(<AIObservabilityPreview />);
    expect(screen.getByText("AI OPERATIONS")).toBeTruthy();
    expect(screen.getByText(/contest_draft · failed/)).toBeTruthy();
    expect(screen.getByText("182 ms")).toBeTruthy();
    expect(screen.queryByText(/prompt content/i)).toBeNull();
    expect(screen.queryByText(/response content/i)).toBeNull();
  });

  it("shows a safe non-blocking unavailable state", () => {
    mocks.query = {
      data: undefined,
      isLoading: false,
      error: new Error("offline"),
    };
    const screen = render(<AIObservabilityPreview />);
    expect(screen.getByRole("alert").textContent).toContain(
      "AI operation metadata is unavailable"
    );
  });
});
