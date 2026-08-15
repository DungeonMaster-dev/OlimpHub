import { describe, expect, it } from "vitest";
import {
  calculateSkillMastery,
  minimumIndependentSolvedProblems,
  skillMasteryCalculationVersion,
} from "./skillMastery";

describe("skill mastery", () => {
  it("returns insufficient evidence rather than a low score without two independently solved mapped problems", () => {
    expect(
      calculateSkillMastery(
        [1, 2],
        [
          { skillId: 1, problemId: 101, relevance: "primary" },
          { skillId: 1, problemId: 101, relevance: "primary" },
        ]
      )
    ).toEqual([
      {
        skillId: 1,
        evidenceCount: 1,
        status: "insufficient_evidence",
        score: null,
      },
      {
        skillId: 2,
        evidenceCount: 0,
        status: "insufficient_evidence",
        score: null,
      },
    ]);
    expect(minimumIndependentSolvedProblems).toBe(2);
  });

  it("calculates only the documented direct-evidence score once the minimum is met", () => {
    expect(
      calculateSkillMastery(
        [9],
        [
          { skillId: 9, problemId: 201, relevance: "primary" },
          { skillId: 9, problemId: 202, relevance: "supporting" },
          { skillId: 9, problemId: 203, relevance: "related" },
        ]
      )
    ).toEqual([
      {
        skillId: 9,
        evidenceCount: 3,
        status: "estimated",
        score: 95,
      },
    ]);
    expect(skillMasteryCalculationVersion).toBe("skill-mastery-v1");
  });
});
