export type SkillGraphEdge = {
  fromSkillId: number;
  toSkillId: number;
  relationType: "prerequisite_of" | "related_to" | "refines";
};

/**
 * Returns a closed cycle path when prerequisite edges would form a cycle.
 * Non-prerequisite relationships intentionally do not participate in the DAG.
 */
export function findPrerequisiteCycle(
  edges: SkillGraphEdge[]
): number[] | null {
  const adjacency = new Map<number, number[]>();
  for (const edge of edges) {
    if (edge.relationType !== "prerequisite_of") continue;
    const next = adjacency.get(edge.fromSkillId) ?? [];
    next.push(edge.toSkillId);
    adjacency.set(edge.fromSkillId, next);
    if (!adjacency.has(edge.toSkillId)) adjacency.set(edge.toSkillId, []);
  }

  const visiting = new Set<number>();
  const visited = new Set<number>();
  const path: number[] = [];

  const visit = (node: number): number[] | null => {
    if (visiting.has(node)) {
      const start = path.indexOf(node);
      return [...path.slice(start), node];
    }
    if (visited.has(node)) return null;
    visiting.add(node);
    path.push(node);
    for (const next of adjacency.get(node) ?? []) {
      const cycle = visit(next);
      if (cycle) return cycle;
    }
    path.pop();
    visiting.delete(node);
    visited.add(node);
    return null;
  };

  for (const node of Array.from(adjacency.keys())) {
    const cycle = visit(node);
    if (cycle) return cycle;
  }
  return null;
}

export function assertPrerequisiteDag(edges: SkillGraphEdge[]): void {
  const cycle = findPrerequisiteCycle(edges);
  if (cycle) {
    throw new Error(`Prerequisite cycle detected: ${cycle.join(" -> ")}`);
  }
}
