import { ArrowRight, Network } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Empty, ErrorState } from "./Home";

export default function Skills() {
  const map = trpc.olimp.skills.map.useQuery();
  if (map.error) return <ErrorState message={map.error.message} />;
  if (map.isLoading)
    return <div className="h-96 animate-pulse rounded-3xl bg-white/[.04]" />;
  const { graphVersion, nodes, edges, links } = map.data!;
  const nodesById = new Map(nodes.map(node => [node.id, node]));
  const prerequisiteEdges = edges.filter(
    edge => edge.relationType === "prerequisite_of"
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
          <div className="skill-map-grid">
            {nodes.map(node => (
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
                  <p className="font-medium text-slate-100">{node.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {
                      links.filter(({ link }) => link.skillId === node.id)
                        .length
                    }{" "}
                    linked problems · {node.domain}
                  </p>
                </div>
              </div>
            ))}
          </div>
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
