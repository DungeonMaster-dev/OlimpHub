export const skillMasteryCalculationVersion = "skill-mastery-v2";
export const minimumIndependentSolvedProblems = 2;

export type SkillMasteryEvidence = {
  skillId: number;
  problemId: number;
  relevance: "primary" | "supporting" | "related";
  difficulty?: number | null;
  attemptCount?: number;
  highestHintLevel?: number;
  solvedAt?: Date | null;
};

export type SkillMasteryFactors = {
  directEvidence: number;
  difficulty: number;
  attempts: number;
  hints: number;
  recency: number;
  relatedSkillContext: number;
};

export type SkillMasteryResult = {
  skillId: number;
  evidenceCount: number;
  status: "insufficient_evidence" | "estimated";
  score: number | null;
  factors: SkillMasteryFactors;
};

export type SkillMasteryReason = {
  code:
    | "insufficient_direct_evidence"
    | "direct_solved_evidence"
    | "problem_difficulty"
    | "deliberate_attempts"
    | "hint_dependence"
    | "recent_practice"
    | "related_skill_context";
  contribution: number;
  label: string;
};

const relevanceWeight = {
  primary: 25,
  supporting: 18,
  related: 10,
} as const;

const emptyFactors = (): SkillMasteryFactors => ({
  directEvidence: 0,
  difficulty: 0,
  attempts: 0,
  hints: 0,
  recency: 0,
  relatedSkillContext: 0,
});

function difficultyContribution(difficulty: number | null | undefined): number {
  if (difficulty == null) return 0;
  return Math.max(0, Math.min(20, Math.round((difficulty - 800) / 80)));
}

function attemptContribution(attemptCount: number | undefined): number {
  return Math.min(6, Math.max(0, (attemptCount ?? 0) - 1) * 3);
}

function hintContribution(highestHintLevel: number | undefined): number {
  if (highestHintLevel == null || highestHintLevel < 0) return 0;
  return -Math.min(12, (highestHintLevel + 1) * 4);
}

function recencyContribution(
  solvedAt: Date | null | undefined,
  now: Date
): number {
  if (!solvedAt) return 0;
  const ageDays = Math.max(
    0,
    (now.getTime() - solvedAt.getTime()) / 86_400_000
  );
  if (ageDays <= 30) return 8;
  if (ageDays <= 90) return 4;
  return 0;
}

/**
 * Calculates a conservative, real-evidence-only mastery estimate. A related
 * skill can add at most five points and never changes an insufficient direct
 * evidence result into an estimate.
 */
export function calculateSkillMastery(
  skillIds: number[],
  evidence: SkillMasteryEvidence[],
  relatedSkillIds: Map<number, number[]> = new Map(),
  now: Date = new Date()
): SkillMasteryResult[] {
  const directResults: SkillMasteryResult[] = skillIds.map(skillId => {
    const deduplicated = new Map<number, SkillMasteryEvidence>();
    for (const item of evidence) {
      if (item.skillId === skillId && !deduplicated.has(item.problemId)) {
        deduplicated.set(item.problemId, item);
      }
    }
    const entries = Array.from(deduplicated.values());
    const factors = emptyFactors();
    if (entries.length < minimumIndependentSolvedProblems) {
      return {
        skillId,
        evidenceCount: entries.length,
        status: "insufficient_evidence" as const,
        score: null,
        factors,
      };
    }
    for (const item of entries) {
      factors.directEvidence += relevanceWeight[item.relevance];
      factors.difficulty += difficultyContribution(item.difficulty);
      factors.attempts += attemptContribution(item.attemptCount);
      factors.hints += hintContribution(item.highestHintLevel);
      factors.recency += recencyContribution(item.solvedAt, now);
    }
    return {
      skillId,
      evidenceCount: entries.length,
      status: "estimated" as const,
      score: Math.max(
        0,
        Math.min(
          100,
          factors.directEvidence +
            factors.difficulty +
            factors.attempts +
            factors.hints +
            factors.recency
        )
      ),
      factors,
    };
  });
  const bySkillId = new Map(
    directResults.map(result => [result.skillId, result])
  );
  return directResults.map(result => {
    if (result.status !== "estimated") return result;
    const relatedScores = (relatedSkillIds.get(result.skillId) ?? []).flatMap(
      relatedSkillId => {
        const related = bySkillId.get(relatedSkillId);
        return related?.status === "estimated" && related.score !== null
          ? [related.score]
          : [];
      }
    );
    const relatedSkillContext = relatedScores.length
      ? Math.min(
          5,
          Math.round(
            relatedScores.reduce((sum, score) => sum + score, 0) /
              relatedScores.length /
              20
          )
        )
      : 0;
    return {
      ...result,
      score: Math.min(100, result.score! + relatedSkillContext),
      factors: { ...result.factors, relatedSkillContext },
    };
  });
}

/** Returns the strongest factual contributors, without exposing private content. */
export function buildSkillMasteryReasons(
  mastery: SkillMasteryResult
): SkillMasteryReason[] {
  if (mastery.status === "insufficient_evidence") {
    return [
      {
        code: "insufficient_direct_evidence",
        contribution: 0,
        label: `${mastery.evidenceCount}/${minimumIndependentSolvedProblems} independent solved problems with this skill`,
      },
    ];
  }
  const candidates: SkillMasteryReason[] = [
    {
      code: "direct_solved_evidence",
      contribution: mastery.factors.directEvidence,
      label: `${mastery.evidenceCount} independently solved mapped problems`,
    },
    {
      code: "problem_difficulty",
      contribution: mastery.factors.difficulty,
      label: "Problem difficulty contribution",
    },
    {
      code: "deliberate_attempts",
      contribution: mastery.factors.attempts,
      label: "Independent attempt contribution",
    },
    {
      code: "hint_dependence",
      contribution: mastery.factors.hints,
      label: "Released-hint adjustment",
    },
    {
      code: "recent_practice",
      contribution: mastery.factors.recency,
      label: "Recent solved-practice contribution",
    },
    {
      code: "related_skill_context",
      contribution: mastery.factors.relatedSkillContext,
      label: "Bounded related-skill context",
    },
  ];
  return candidates
    .filter(reason => reason.contribution !== 0)
    .sort(
      (first, second) =>
        Math.abs(second.contribution) - Math.abs(first.contribution)
    )
    .slice(0, 3);
}
