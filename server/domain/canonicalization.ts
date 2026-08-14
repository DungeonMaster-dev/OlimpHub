export const problemRelationTypes = [
  "same_problem",
  "translation_of",
  "adapted_from",
  "duplicate_candidate",
  "prerequisite",
  "follow_up",
  "variant_of",
] as const;

export type ProblemRelationType = (typeof problemRelationTypes)[number];
export type CanonicalizationStatus =
  | "source_distinct"
  | "candidate_duplicate"
  | "linked_duplicate"
  | "canonical";

export function normalizeProblemRelation(input: {
  firstProblemId: number;
  secondProblemId: number;
  relationType: ProblemRelationType;
}) {
  if (input.firstProblemId === input.secondProblemId) {
    throw new Error("A problem cannot be related to itself.");
  }
  return {
    leftProblemId: Math.min(input.firstProblemId, input.secondProblemId),
    rightProblemId: Math.max(input.firstProblemId, input.secondProblemId),
    relationType: input.relationType,
  };
}

export function canonicalizationStatusForProposal(
  relationType: ProblemRelationType
) {
  return relationType === "same_problem" ||
    relationType === "duplicate_candidate"
    ? "candidate_duplicate"
    : null;
}

export function canonicalizationStatusForApproval(
  relationType: ProblemRelationType
) {
  return relationType === "same_problem" ? "linked_duplicate" : null;
}

export function reconcileCanonicalizationStatus(input: {
  currentStatus: CanonicalizationStatus;
  relations: Array<{
    relationType: ProblemRelationType;
    reviewStatus: "proposed" | "approved" | "rejected";
  }>;
}): CanonicalizationStatus {
  if (input.currentStatus === "canonical") return "canonical";
  if (
    input.relations.some(
      relation =>
        relation.relationType === "same_problem" &&
        relation.reviewStatus === "approved"
    )
  ) {
    return "linked_duplicate";
  }
  if (
    input.relations.some(
      relation =>
        relation.reviewStatus !== "rejected" &&
        (relation.relationType === "same_problem" ||
          relation.relationType === "duplicate_candidate")
    )
  ) {
    return "candidate_duplicate";
  }
  return "source_distinct";
}
