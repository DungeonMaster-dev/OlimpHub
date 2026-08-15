// @vitest-environment jsdom

import { cleanup, fireEvent, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({ trpc: {} }));

import { TrainingRecommendationPlan } from "../client/src/pages/Training";

describe("dedicated training recommendation plan", () => {
  afterEach(cleanup);

  it("renders bounded duration and forwards the proposal to the editable handoff", () => {
    const onUsePlan = vi.fn();
    const screen = render(
      <TrainingRecommendationPlan
        loading={false}
        onUsePlan={onUsePlan}
        plan={{
          calculationVersion: "training-recommendations-v1",
          status: "ready",
          problemRecommendationStatus: "ready",
          creationHandoff: { title: "Recommended practice", problemIds: [4] },
          expectedDuration: {
            status: "estimated",
            expectedMinutes: 20,
            lowerMinutes: 14,
            upperMinutes: 26,
            reason: "Bounded evidence.",
          },
          recommendations: [
            {
              problem: { id: 4, title: "Graph traversal", difficulty: 1200 },
              reason: "Prioritized because its personal progress is paused.",
            },
          ],
          limitations: [],
        }}
      />
    );

    expect(screen.getByText("Suggested focused session")).toBeTruthy();
    expect(screen.getByText(/20 min expected/i)).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Use this training plan" })
    );
    expect(onUsePlan).toHaveBeenCalledWith({
      title: "Recommended practice",
      problemIds: [4],
    });
  });

  it("shows a non-blocking unavailable state", () => {
    const screen = render(
      <TrainingRecommendationPlan
        loading={false}
        error="unavailable"
        plan={undefined}
        onUsePlan={vi.fn()}
      />
    );

    expect(screen.getByRole("alert").textContent).toContain(
      "curate any session manually"
    );
  });
});
