// @vitest-environment jsdom

import { cleanup, fireEvent, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({ trpc: {} }));

import { ProblemRecommendations } from "../client/src/pages/Training";

describe("dedicated problem recommendation cards", () => {
  afterEach(cleanup);

  it("renders real problem reasons and forwards the selected IDs to an editable handoff", () => {
    const onUseRecommendations = vi.fn();
    const screen = render(
      <ProblemRecommendations
        loading={false}
        onUseRecommendations={onUseRecommendations}
        recommendations={{
          calculationVersion: "problem-recommendations-v1",
          status: "ready",
          progression: {
            status: "estimated",
            targetDifficulty: 1300,
            reason: "Target uses verified solved difficulty evidence.",
          },
          exclusions: ["active_training_assignment"],
          recommendations: [
            {
              problem: { id: 8, title: "Graph traversal", difficulty: 1300 },
              reasonCode: "planned_practice",
              reason:
                "Prioritized because personal progress explicitly marks it planned.",
            },
          ],
          limitations: [],
        }}
      />
    );

    expect(screen.getByText("Choose your next problem")).toBeTruthy();
    expect(screen.getByText("Graph traversal")).toBeTruthy();
    expect(screen.getByText(/do not predict outcomes/i)).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Use recommended problems" })
    );
    expect(onUseRecommendations).toHaveBeenCalledWith([8]);
  });

  it("shows safe non-blocking feedback when the recommendation query is unavailable", () => {
    const screen = render(
      <ProblemRecommendations
        loading={false}
        error="unavailable"
        recommendations={undefined}
        onUseRecommendations={vi.fn()}
      />
    );

    expect(screen.getByRole("alert").textContent).toContain(
      "session form remains fully editable"
    );
  });
});
