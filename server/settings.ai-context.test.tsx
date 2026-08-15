// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({ trpc: {} }));

import { AIContextPreview } from "../client/src/pages/Settings";

describe("AI context settings preview", () => {
  afterEach(cleanup);

  it("renders aggregate-only facts and makes its deliberate exclusions visible", () => {
    const screen = render(
      <AIContextPreview
        loading={false}
        error={null}
        context={{
          contextVersion: "user-context-v1",
          progressByStatus: { paused: 2, solved: 3 },
          attemptsByState: { active: 1 },
          trainingSessionsByStatus: { completed: 4 },
          contestSessionsByStatus: { expired: 1 },
          excludedData: ["free_form_notes"],
        }}
      />
    );

    expect(screen.getByText("AI CONTEXT")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
    expect(
      screen.getByText(/excludes notes, source code, raw activity/i)
    ).toBeTruthy();
    expect(screen.queryByText("Private note content")).toBeNull();
  });

  it("shows safe non-blocking feedback when the context preview cannot load", () => {
    const screen = render(
      <AIContextPreview context={undefined} loading={false} error="forbidden" />
    );

    expect(screen.getByRole("alert").textContent).toContain(
      "No data was sent to an AI feature"
    );
  });
});
