import { describe, expect, it } from "vitest";
import {
  buildSkillMasteryReasons,
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
        factors: {
          directEvidence: 0,
          difficulty: 0,
          attempts: 0,
          hints: 0,
          recency: 0,
          relatedSkillContext: 0,
        },
      },
      {
        skillId: 2,
        evidenceCount: 0,
        status: "insufficient_evidence",
        score: null,
        factors: {
          directEvidence: 0,
          difficulty: 0,
          attempts: 0,
          hints: 0,
          recency: 0,
          relatedSkillContext: 0,
        },
      },
    ]);
    expect(minimumIndependentSolvedProblems).toBe(2);
  });

  it("accounts for verified difficulty, attempts, hints and recency once direct evidence is sufficient", () => {
    const now = new Date("2026-08-15T00:00:00.000Z");
    const result = calculateSkillMastery(
      [9],
      [
        {
          skillId: 9,
          problemId: 201,
          relevance: "primary",
          difficulty: 1600,
          attemptCount: 2,
          highestHintLevel: -1,
          solvedAt: new Date("2026-08-10T00:00:00.000Z"),
        },
        {
          skillId: 9,
          problemId: 202,
          relevance: "supporting",
          difficulty: 1200,
          attemptCount: 1,
          highestHintLevel: 0,
          solvedAt: new Date("2026-05-01T00:00:00.000Z"),
        },
      ],
      new Map(),
      now
    );

    expect(result).toEqual([
      {
        skillId: 9,
        evidenceCount: 2,
        status: "estimated",
        score: 65,
        factors: {
          directEvidence: 43,
          difficulty: 15,
          attempts: 3,
          hints: -4,
          recency: 8,
          relatedSkillContext: 0,
        },
      },
    ]);
    expect(skillMasteryCalculationVersion).toBe("skill-mastery-v2");
  });

  it("caps related-skill context and never promotes insufficient direct evidence", () => {
    const result = calculateSkillMastery(
      [1, 2, 3],
      [
        { skillId: 1, problemId: 10, relevance: "primary" },
        { skillId: 1, problemId: 11, relevance: "primary" },
        { skillId: 2, problemId: 20, relevance: "primary" },
        { skillId: 2, problemId: 21, relevance: "primary" },
        { skillId: 2, problemId: 22, relevance: "primary" },
        { skillId: 2, problemId: 23, relevance: "primary" },
        { skillId: 3, problemId: 30, relevance: "primary" },
      ],
      new Map([
        [1, [2]],
        [2, [1, 3]],
        [3, [2]],
      ]),
      new Date("2026-08-15T00:00:00.000Z")
    );

    expect(result[0]).toMatchObject({
      status: "estimated",
      score: 55,
      factors: { relatedSkillContext: 5 },
    });
    expect(result[2]).toMatchObject({
      status: "insufficient_evidence",
      score: null,
      factors: { relatedSkillContext: 0 },
    });
  });

  it("projects short factual reasons without private problem, note or hint content", () => {
    const [estimated] = calculateSkillMastery(
      [1],
      [
        { skillId: 1, problemId: 10, relevance: "primary" },
        { skillId: 1, problemId: 11, relevance: "supporting" },
      ],
      new Map(),
      new Date("2026-08-15T00:00:00.000Z")
    );
    const [insufficient] = calculateSkillMastery([2], []);

    expect(buildSkillMasteryReasons(estimated)).toEqual([
      {
        code: "direct_solved_evidence",
        contribution: 43,
        label: "2 independently solved mapped problems",
      },
    ]);
    expect(buildSkillMasteryReasons(insufficient)).toEqual([
      {
        code: "insufficient_direct_evidence",
        contribution: 0,
        label: "0/2 independent solved problems with this skill",
      },
    ]);
  });

  it("bounds extreme verified factor values and caps the final score", () => {
    const [result] = calculateSkillMastery(
      [7],
      [
        {
          skillId: 7,
          problemId: 1,
          relevance: "primary",
          difficulty: 9999,
          attemptCount: 999,
          solvedAt: new Date("2026-08-14T00:00:00.000Z"),
        },
        {
          skillId: 7,
          problemId: 2,
          relevance: "primary",
          difficulty: 9999,
          attemptCount: 999,
          solvedAt: new Date("2026-08-14T00:00:00.000Z"),
        },
        {
          skillId: 7,
          problemId: 3,
          relevance: "primary",
          difficulty: 9999,
          attemptCount: 999,
          solvedAt: new Date("2026-08-14T00:00:00.000Z"),
        },
        {
          skillId: 7,
          problemId: 4,
          relevance: "primary",
          difficulty: 9999,
          attemptCount: 999,
          solvedAt: new Date("2026-08-14T00:00:00.000Z"),
        },
      ],
      new Map(),
      new Date("2026-08-15T00:00:00.000Z")
    );

    expect(result).toMatchObject({
      status: "estimated",
      score: 100,
      factors: {
        directEvidence: 100,
        difficulty: 80,
        attempts: 24,
        hints: 0,
        recency: 32,
        relatedSkillContext: 0,
      },
    });
  });
});
