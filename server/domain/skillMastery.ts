export const skillMasteryCalculationVersion = "skill-mastery-v1";
export const minimumIndependentSolvedProblems = 2;

export type SkillMasteryEvidence = {
  skillId: number;
  problemId: number;
  relevance: "primary" | "supporting" | "related";
};

export type SkillMasteryResult = {
  skillId: number;
  evidenceCount: number;
  status: "insufficient_evidence" | "estimated";
  score: number | null;
};

const relevanceWeight = {
  primary: 50,
  supporting: 30,
  related: 15,
} as const;

/**
 * Calculates a deliberately conservative direct-evidence score. Difficulty,
 * attempts, hints, recency and graph propagation are explicit future inputs
 * of P1-705; this first version never treats one solved problem as mastery.
 */
export function calculateSkillMastery(
  skillIds: number[],
  evidence: SkillMasteryEvidence[]
): SkillMasteryResult[] {
  return skillIds.map(skillId => {
    const deduplicated = new Map<number, SkillMasteryEvidence>();
    for (const item of evidence) {
      if (item.skillId === skillId && !deduplicated.has(item.problemId)) {
        deduplicated.set(item.problemId, item);
      }
    }
    const entries = Array.from(deduplicated.values());
    if (entries.length < minimumIndependentSolvedProblems) {
      return {
        skillId,
        evidenceCount: entries.length,
        status: "insufficient_evidence",
        score: null,
      };
    }
    return {
      skillId,
      evidenceCount: entries.length,
      status: "estimated",
      score: Math.min(
        100,
        entries.reduce(
          (total, item) => total + relevanceWeight[item.relevance],
          0
        )
      ),
    };
  });
}
