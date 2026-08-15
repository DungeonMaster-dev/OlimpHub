// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({ trpc: {} }));

import { FactualProgressAnalysis } from "../client/src/pages/Progress";

describe("AI-ready factual progress snapshot", () => {
  afterEach(cleanup);

  it("renders aggregate observations and their stated no-prediction limit", () => {
    const screen = render(
      <FactualProgressAnalysis
        loading={false}
        analysis={{
          calculationVersion: "progress-analysis-v1",
          contextVersion: "user-context-v1",
          status: "available",
          observations: [
            {
              code: "solved_progress",
              count: 3,
              label: "Solved progress records",
              detail: "3 persisted problem-progress records is marked solved.",
            },
          ],
          evidence: {
            progressRecords: 3,
            attempts: 0,
            trainingSessions: 0,
            contestSessions: 0,
          },
          limitations: [],
        }}
      />
    );

    expect(screen.getByText("Current learning evidence")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText(/does not predict ability, ranking/i)).toBeTruthy();
  });

  it("shows safe non-blocking feedback when analysis cannot load", () => {
    const screen = render(
      <FactualProgressAnalysis
        loading={false}
        error="forbidden"
        analysis={undefined}
      />
    );

    expect(screen.getByRole("alert").textContent).toContain(
      "No coaching prompt was generated"
    );
  });
});
