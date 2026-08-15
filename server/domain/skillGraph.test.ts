import { describe, expect, it } from "vitest";
import { assertPrerequisiteDag, findPrerequisiteCycle } from "./skillGraph";

describe("skill prerequisite graph", () => {
  it("accepts an acyclic prerequisite graph and ignores non-prerequisite relations", () => {
    const edges = [
      {
        fromSkillId: 1,
        toSkillId: 2,
        relationType: "prerequisite_of" as const,
      },
      {
        fromSkillId: 2,
        toSkillId: 3,
        relationType: "prerequisite_of" as const,
      },
      { fromSkillId: 3, toSkillId: 1, relationType: "related_to" as const },
    ];

    expect(findPrerequisiteCycle(edges)).toBeNull();
    expect(() => assertPrerequisiteDag(edges)).not.toThrow();
  });

  it("returns the closed path and rejects a prerequisite cycle", () => {
    const edges = [
      {
        fromSkillId: 11,
        toSkillId: 12,
        relationType: "prerequisite_of" as const,
      },
      {
        fromSkillId: 12,
        toSkillId: 13,
        relationType: "prerequisite_of" as const,
      },
      {
        fromSkillId: 13,
        toSkillId: 11,
        relationType: "prerequisite_of" as const,
      },
    ];

    expect(findPrerequisiteCycle(edges)).toEqual([11, 12, 13, 11]);
    expect(() => assertPrerequisiteDag(edges)).toThrow(
      "Prerequisite cycle detected: 11 -> 12 -> 13 -> 11"
    );
  });
});
