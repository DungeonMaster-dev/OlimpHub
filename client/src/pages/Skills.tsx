import { ArrowRight, Network } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Empty, ErrorState } from "./Home";

export default function Skills() {
  const map = trpc.olimp.skills.map.useQuery();
  const mastery = trpc.olimp.skills.mastery.useQuery();
  if (map.error) return <ErrorState message={map.error.message} />;
  if (map.isLoading)
    return <div className="h-96 animate-pulse rounded-3xl bg-white/[.04]" />;
  const { graphVersion, nodes, edges, links } = map.data!;
  const nodesById = new Map(nodes.map(node => [node.id, node]));
  const masteryBySkillId = new Map(
    (mastery.data?.skills ?? []).map(({ skill, mastery: result, reasons }) => [
      skill.id,
      { result, reasons },
    ])
  );
  const nodesByDomain = {
    algorithms: nodes.filter(node => node.domain === "algorithms"),
    mathematics: nodes.filter(node => node.domain === "mathematics"),
    practice: nodes.filter(node => node.domain === "practice"),
  };
  const prerequisiteEdges = edges.filter(
    edge => edge.relationType === "prerequisite_of"
  );
  const prerequisiteNodeIds = new Set(
    prerequisiteEdges.flatMap(edge => [edge.fromSkillId, edge.toSkillId])
  );
  const graphNodes = nodes.filter(node => prerequisiteNodeIds.has(node.id));
  const incomingPrerequisites = new Map<number, number[]>();
  for (const edge of prerequisiteEdges) {
    incomingPrerequisites.set(edge.toSkillId, [
      ...(incomingPrerequisites.get(edge.toSkillId) ?? []),
      edge.fromSkillId,
    ]);
  }
  const depthBySkillId = new Map<number, number>();
  const resolving = new Set<number>();
  const getDepth = (skillId: number): number => {
    const existing = depthBySkillId.get(skillId);
    if (existing !== undefined) return existing;
    if (resolving.has(skillId)) return 0;
    resolving.add(skillId);
    const predecessors = incomingPrerequisites.get(skillId) ?? [];
    const depth = predecessors.length
      ? Math.max(...predecessors.map(getDepth)) + 1
      : 0;
    resolving.delete(skillId);
    depthBySkillId.set(skillId, depth);
    return depth;
  };
  for (const node of graphNodes) getDepth(node.id);
  const nodesByDepth = new Map<number, typeof graphNodes>();
  for (const node of graphNodes) {
    const depth = getDepth(node.id);
    nodesByDepth.set(depth, [...(nodesByDepth.get(depth) ?? []), node]);
  }
  const graphLayout = new Map<number, { x: number; y: number }>();
  const columnWidth = 220;
  const rowHeight = 78;
  const graphHeight = Math.max(
    160,
    ...Array.from(nodesByDepth.values()).map(
      column => column.length * rowHeight + 36
    )
  );
  for (const [depth, column] of Array.from(nodesByDepth.entries())) {
    column.forEach((node, index) => {
      graphLayout.set(node.id, {
        x: depth * columnWidth + 18,
        y: index * rowHeight + 26,
      });
    });
  }
  const graphWidth = Math.max(
    480,
    (Math.max(0, ...Array.from(nodesByDepth.keys())) + 1) * columnWidth + 18
  );
  return (
    <div className="space-y-7">
      <section>
        <p className="eyebrow">SKILL MAP</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em]">
          See the dependencies behind a technique.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          The map is sourced from approved skill records and does not infer
          missing mastery. Connections remain visible, reviewable, and separate
          from external source tags.
        </p>
        {graphVersion && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="tag">
              taxonomy v{graphVersion.semanticVersion}
            </span>
            <span>{graphVersion.changeSummary}</span>
          </div>
        )}
      </section>
      {nodes.length ? (
        <section className="panel overflow-hidden">
          {(["algorithms", "mathematics", "practice"] as const).map(
            domain =>
              nodesByDomain[domain].length > 0 && (
                <div key={domain} className="mb-6 last:mb-0">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="eyebrow">{domain.replaceAll("-", " ")}</p>
                    {domain === "mathematics" && (
                      <span className="text-xs text-amber-100/80">
                        taxonomy only · no automatic recommendations
                      </span>
                    )}
                  </div>
                  <div className="skill-map-grid">
                    {nodesByDomain[domain].map(node =>
                      (() => {
                        const masteryRecord = masteryBySkillId.get(node.id);
                        const masteryLabel = masteryRecord
                          ? masteryRecord.result.status === "estimated"
                            ? `${masteryRecord.result.score}% multi-factor evidence · ${masteryRecord.result.evidenceCount} solved`
                            : `Insufficient evidence · ${masteryRecord.result.evidenceCount}/${mastery.data?.minimumIndependentSolvedProblems ?? 2} solved`
                          : mastery.isError
                            ? "Mastery unavailable"
                            : "Calculating mastery…";
                        return (
                          <div
                            key={node.id}
                            className="skill-node"
                            style={{ borderColor: `${node.color}55` }}
                          >
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: node.color }}
                            />
                            <div>
                              <p className="font-medium text-slate-100">
                                {node.title}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {
                                  links.filter(
                                    ({ link }) => link.skillId === node.id
                                  ).length
                                }{" "}
                                linked problems · {node.domain}
                              </p>
                              <p className="mt-1 text-xs text-indigo-100/75">
                                {masteryLabel}
                              </p>
                              {masteryRecord?.reasons[0] && (
                                <p className="mt-1 text-xs text-slate-500">
                                  {masteryRecord.reasons[0].label}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>
              )
          )}
          {prerequisiteEdges.length > 0 && (
            <div className="mt-6 border-t border-white/[.06] pt-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="eyebrow">DEPENDENCY GRAPH</p>
                <p className="text-xs text-slate-500">
                  Current version · arrows point toward the dependent skill
                </p>
              </div>
              <div className="mt-3 overflow-x-auto rounded-xl border border-white/[.06] bg-white/[.015] p-3">
                <svg
                  className="min-w-[480px]"
                  viewBox={`0 0 ${graphWidth} ${graphHeight}`}
                  role="img"
                  aria-label={`${prerequisiteEdges.length} prerequisite relationships in taxonomy version ${graphVersion?.semanticVersion ?? "unavailable"}`}
                >
                  <defs>
                    <marker
                      id="skill-graph-arrow"
                      markerWidth="7"
                      markerHeight="7"
                      refX="6"
                      refY="3.5"
                      orient="auto"
                    >
                      <path d="M0,0 L7,3.5 L0,7 Z" fill="#818cf8" />
                    </marker>
                  </defs>
                  {prerequisiteEdges.map(edge => {
                    const from = graphLayout.get(edge.fromSkillId);
                    const to = graphLayout.get(edge.toSkillId);
                    if (!from || !to) return null;
                    return (
                      <line
                        key={edge.id}
                        x1={from.x + 170}
                        y1={from.y + 21}
                        x2={to.x - 8}
                        y2={to.y + 21}
                        stroke="#818cf8"
                        strokeOpacity="0.75"
                        strokeWidth="1.5"
                        markerEnd="url(#skill-graph-arrow)"
                      />
                    );
                  })}
                  {graphNodes.map(node => {
                    const position = graphLayout.get(node.id)!;
                    return (
                      <g key={node.id} tabIndex={0}>
                        <rect
                          x={position.x}
                          y={position.y}
                          width="170"
                          height="42"
                          rx="9"
                          fill="#111827"
                          stroke={node.color}
                          strokeOpacity="0.8"
                        />
                        <text
                          x={position.x + 11}
                          y={position.y + 25}
                          fill="#e2e8f0"
                          fontSize="11"
                        >
                          {node.title.length > 24
                            ? `${node.title.slice(0, 21)}…`
                            : node.title}
                        </text>
                        <title>{node.title}</title>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}
          <div className="mt-6 border-t border-white/[.06] pt-5">
            <p className="eyebrow">PREREQUISITE PATHS</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {prerequisiteEdges.map(edge => {
                const prerequisite = nodesById.get(edge.fromSkillId);
                const target = nodesById.get(edge.toSkillId);
                return (
                  <div
                    key={edge.id}
                    className="flex items-center gap-2 rounded-lg border border-white/[.06] bg-white/[.02] px-3 py-2 text-xs text-slate-400"
                  >
                    <span className="truncate text-slate-200">
                      {prerequisite?.title ?? "Unknown skill"}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-indigo-200" />
                    <span className="truncate text-indigo-100">
                      {target?.title ?? "Unknown skill"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          {links.length > 0 && (
            <div className="mt-6 border-t border-white/[.06] pt-5">
              <p className="eyebrow">LINKED PROBLEMS</p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {links.slice(0, 12).map(({ link, problem }) => (
                  <div
                    key={link.id}
                    className="rounded-lg border border-white/[.06] bg-white/[.02] px-3 py-2"
                  >
                    <p className="truncate text-sm text-slate-200">
                      {problem.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {nodesById.get(link.skillId)?.title ?? "Unmapped skill"} ·{" "}
                      {link.relevance}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      ) : (
        <div className="panel">
          <Empty
            text="Approved skill nodes will appear here after the skill map is populated. The product does not invent relationships merely for a visual graph."
            icon={Network}
          />
        </div>
      )}
    </div>
  );
}
