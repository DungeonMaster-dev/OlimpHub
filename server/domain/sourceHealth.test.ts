import { describe, expect, it } from "vitest";
import { summarizeSourceHealth } from "./sourceHealth";

const now = new Date("2026-08-14T12:00:00.000Z");
const observation = (overrides = {}) => ({
  sourceId: "codeforces",
  scopeKey: "catalogue",
  status: "succeeded" as const,
  lastStartedAt: now,
  lastFinishedAt: now,
  updatedAt: now,
  lastError: null,
  ...overrides,
});

describe("source health summary", () => {
  it("includes a known source before its first sync as unknown", () => {
    expect(summarizeSourceHealth([])).toMatchObject([
      { sourceId: "codeforces", status: "unknown", scopeCount: 0 },
    ]);
  });

  it("projects completed source syncs as healthy without exposing errors", () => {
    expect(summarizeSourceHealth([observation()])).toMatchObject([
      { sourceId: "codeforces", status: "healthy", scopeCount: 1 },
    ]);
  });

  it("distinguishes throttling, provider failure, and a configuration/data issue", () => {
    expect(
      summarizeSourceHealth([
        observation({
          status: "rate_limited",
          lastError: "Call limit exceeded",
        }),
      ])
    ).toMatchObject([{ status: "rate_limited" }]);
    expect(
      summarizeSourceHealth([
        observation({ status: "failed", lastError: "network unavailable" }),
      ])
    ).toMatchObject([{ status: "degraded" }]);
    expect(
      summarizeSourceHealth([
        observation({ status: "failed", lastError: "handle does not exist" }),
      ])
    ).toMatchObject([{ status: "attention" }]);
  });
});
