// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const timeline = {
  period: {
    startsAt: new Date("2026-08-10T00:00:00.000Z"),
    endsAt: new Date("2026-08-12T23:59:59.000Z"),
    days: 30,
  },
  ratingChanges: [],
  dailyActivity: [
    { date: "2026-08-10", activityCount: 0, solvedUpdates: 0 },
    { date: "2026-08-11", activityCount: 3, solvedUpdates: 1 },
    { date: "2026-08-12", activityCount: 1, solvedUpdates: 0 },
  ],
};

vi.mock("@/lib/trpc", () => ({
  trpc: {
    olimp: {
      analytics: {
        summary: {
          useQuery: () => ({
            data: {
              metrics: {
                solvedProblems: 1,
                startedAttempts: 2,
                activeAttempts: 1,
                trackedEvents: 4,
              },
              evidence: [],
              period: timeline.period,
              calculationVersion: "v1",
            },
            isLoading: false,
            error: null,
          }),
        },
        timeline: {
          useQuery: () => ({ data: timeline, isLoading: false, error: null }),
        },
        activityStatistics: {
          useQuery: () => ({
            data: {
              periodBasis: "utc_calendar",
              statistics: {
                day: { eventCount: 1, activeMinutes: 1, solvedUpdates: 0 },
                week: { eventCount: 4, activeMinutes: 3, solvedUpdates: 1 },
                month: { eventCount: 9, activeMinutes: 6, solvedUpdates: 2 },
              },
            },
            isLoading: false,
            error: null,
          }),
        },
        activityStreak: {
          useQuery: () => ({
            data: {
              periodBasis: "utc_calendar",
              streak: {
                currentDays: 3,
                activeToday: true,
                lastActiveDate: "2026-08-12",
              },
            },
            isLoading: false,
            error: null,
          }),
        },
      },
    },
  },
}));

vi.mock("../client/src/pages/Home", () => ({
  ErrorState: ({ message }: { message: string }) => <p>{message}</p>,
}));

import Progress from "../client/src/pages/Progress";

describe("Progress activity timeline", () => {
  it("renders factual daily persisted-activity buckets, including zero-activity days", () => {
    render(<Progress />);

    expect(
      screen.getByRole("heading", { name: "Daily activity" })
    ).toBeTruthy();
    expect(
      screen.getByLabelText("Daily recorded workspace activity")
    ).toBeTruthy();
    expect(
      screen.getByTitle("2026-08-10: 0 events, 0 solved updates")
    ).toBeTruthy();
    expect(
      screen.getByTitle("2026-08-11: 3 events, 1 solved updates")
    ).toBeTruthy();
    expect(screen.getByText("1 solved updates")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Calendar statistics" })
    ).toBeTruthy();
    expect(screen.getByText("3m")).toBeTruthy();
    expect(screen.getByText("4 events · 1 solved updates")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "3 consecutive days" })
    ).toBeTruthy();
    expect(screen.getByText("active today")).toBeTruthy();
  });
});
