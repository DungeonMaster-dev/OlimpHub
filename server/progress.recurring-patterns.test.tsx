// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({ trpc: {} }));

import { RecurringEvidencePatterns } from "../client/src/pages/Progress";

describe("recurring attempt evidence panel", () => {
  afterEach(cleanup);

  it("shows a repeated stored fact without claiming a cause", () => {
    const screen = render(
      <RecurringEvidencePatterns
        loading={false}
        analysis={{
          calculationVersion: "recurring-patterns-v1",
          minimumEvidence: 2,
          status: "patterns_detected",
          analyzedAttemptCount: 3,
          recurringPatterns: [
            {
              code: "repeated_unresolved_outcomes",
              count: 2,
              label: "Repeated unresolved outcomes",
              detail:
                "2 terminal attempts are recorded with a not-solved outcome.",
            },
          ],
          limitations: [],
        }}
      />
    );

    expect(screen.getByText("Repeated attempt facts")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText(/not diagnoses of why/i)).toBeTruthy();
  });

  it("shows safe non-blocking unavailable feedback", () => {
    const screen = render(
      <RecurringEvidencePatterns
        loading={false}
        error="temporarily unavailable"
        analysis={undefined}
      />
    );

    expect(screen.getByRole("alert").textContent).toContain(
      "No interpretation was generated"
    );
  });
});
