import { describe, expect, it } from "vitest";
import {
  contestExpiresAt,
  hasContestExpired,
  remainingContestSeconds,
} from "./contestTimer";

describe("contest timer", () => {
  it("derives a deadline from the server start instant and configured duration", () => {
    const startedAt = new Date("2026-08-15T09:00:00.000Z");

    expect(contestExpiresAt(startedAt, 90)).toEqual(
      new Date("2026-08-15T10:30:00.000Z")
    );
  });

  it("returns bounded server-clock remaining seconds and an exact expiry boundary", () => {
    const expiresAt = new Date("2026-08-15T10:00:00.000Z");

    expect(
      remainingContestSeconds(expiresAt, new Date("2026-08-15T09:59:58.250Z"))
    ).toBe(2);
    expect(
      remainingContestSeconds(expiresAt, new Date("2026-08-15T10:01:00.000Z"))
    ).toBe(0);
    expect(hasContestExpired(expiresAt, expiresAt)).toBe(true);
  });
});
