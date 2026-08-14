import { describe, expect, it } from "vitest";
import {
  canBeginCodeforcesSync,
  codeforcesCooldownMs,
  nextTrainingItemStatus,
  normalizeCatalogueInput,
  shouldWriteAttemptTransition,
} from "./workflows";

describe("catalogue filters", () => {
  it("normalizes optional source and skill input without inventing a filter", () => {
    expect(
      normalizeCatalogueInput({
        query: "  dijkstra ",
        tag: " GRAPHS ",
        source: " Codeforces ",
        skillId: 5,
        minDifficulty: 1600,
      })
    ).toEqual({
      query: "dijkstra",
      tag: "graphs",
      source: "codeforces",
      skillId: 5,
      minDifficulty: 1600,
    });
    expect(normalizeCatalogueInput({ skillId: 0, minDifficulty: -1 })).toEqual({
      query: undefined,
      tag: undefined,
      source: undefined,
      skillId: undefined,
      minDifficulty: undefined,
    });
  });
});

describe("attempt and training lifecycle", () => {
  it("does not write an unchanged attempt transition", () => {
    expect(
      shouldWriteAttemptTransition("paused", "paused", "unknown", "unknown")
    ).toBe(false);
    expect(
      shouldWriteAttemptTransition("active", "paused", "unknown", "unknown")
    ).toBe(true);
  });

  it("keeps terminal training items terminal", () => {
    expect(nextTrainingItemStatus("queued", "active")).toBe("active");
    expect(nextTrainingItemStatus("completed", "active")).toBe("completed");
    expect(nextTrainingItemStatus("skipped", "completed")).toBe("skipped");
  });
});

describe("Codeforces sync cooldown", () => {
  it("permits a first run and blocks a same-scope run inside the cooldown", () => {
    const now = new Date("2026-08-14T20:00:00.000Z");
    expect(canBeginCodeforcesSync(null, now)).toBe(true);
    expect(
      canBeginCodeforcesSync(
        new Date(now.getTime() - codeforcesCooldownMs + 1),
        now
      )
    ).toBe(false);
    expect(
      canBeginCodeforcesSync(
        new Date(now.getTime() - codeforcesCooldownMs),
        now
      )
    ).toBe(true);
  });
});
