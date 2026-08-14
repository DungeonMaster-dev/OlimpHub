import { describe, expect, it } from "vitest";
import {
  canonicalizationStatusForApproval,
  canonicalizationStatusForProposal,
  normalizeProblemRelation,
  reconcileCanonicalizationStatus,
} from "./canonicalization";

describe("problem canonicalization rules", () => {
  it("normalizes every symmetric relation into one deterministic orientation", () => {
    expect(
      normalizeProblemRelation({
        firstProblemId: 42,
        secondProblemId: 7,
        relationType: "same_problem",
      })
    ).toEqual({
      leftProblemId: 7,
      rightProblemId: 42,
      relationType: "same_problem",
    });
  });

  it("rejects a self-relation instead of fabricating a duplicate", () => {
    expect(() =>
      normalizeProblemRelation({
        firstProblemId: 7,
        secondProblemId: 7,
        relationType: "same_problem",
      })
    ).toThrow("cannot be related to itself");
  });

  it("only elevates duplicate evidence after an explicit relation decision", () => {
    expect(canonicalizationStatusForProposal("same_problem")).toBe(
      "candidate_duplicate"
    );
    expect(canonicalizationStatusForApproval("same_problem")).toBe(
      "linked_duplicate"
    );
    expect(canonicalizationStatusForApproval("translation_of")).toBeNull();
  });

  it("reverts a rejected duplicate proposal when no active duplicate evidence remains", () => {
    expect(
      reconcileCanonicalizationStatus({
        currentStatus: "candidate_duplicate",
        relations: [{ relationType: "same_problem", reviewStatus: "rejected" }],
      })
    ).toBe("source_distinct");
  });

  it("preserves an approved duplicate link and an explicit canonical record", () => {
    expect(
      reconcileCanonicalizationStatus({
        currentStatus: "candidate_duplicate",
        relations: [
          { relationType: "same_problem", reviewStatus: "approved" },
          { relationType: "duplicate_candidate", reviewStatus: "rejected" },
        ],
      })
    ).toBe("linked_duplicate");
    expect(
      reconcileCanonicalizationStatus({
        currentStatus: "canonical",
        relations: [],
      })
    ).toBe("canonical");
  });
});
