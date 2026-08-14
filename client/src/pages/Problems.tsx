import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ExternalLink,
  Filter,
  Loader2,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Empty, ErrorState } from "./Home";

export default function Problems() {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [source, setSource] = useState("all");
  const [skillId, setSkillId] = useState("all");
  const input = useMemo(
    () => ({
      query: query || undefined,
      tag: tag || undefined,
      source: source === "all" ? undefined : source,
      skillId: skillId === "all" ? undefined : Number(skillId),
      minDifficulty: difficulty === "all" ? undefined : Number(difficulty),
      page: 0,
      pageSize: 24,
    }),
    [query, tag, difficulty, source, skillId]
  );
  const catalogue = trpc.olimp.catalogue.list.useQuery(input);
  const skillMap = trpc.olimp.skills.map.useQuery();
  const utils = trpc.useUtils();
  const sync = trpc.olimp.codeforces.syncCatalogue.useMutation({
    onSuccess: () => utils.olimp.catalogue.list.invalidate(),
  });
  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">PROBLEM CATALOGUE</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em]">
            Choose a problem with intent.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
            Search imported metadata, filter by skill signals, and open the
            original source when you are ready to solve.
          </p>
        </div>
        <button
          onClick={() => sync.mutate()}
          disabled={sync.isPending}
          className="quiet-button"
        >
          {sync.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ExternalLink className="h-4 w-4" />
          )}{" "}
          Refresh Codeforces metadata
        </button>
      </section>
      <section className="panel p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_160px_160px_160px_180px]">
          <label className="field-shell">
            <Search className="h-4 w-4" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search by title or tag"
            />
          </label>
          <label className="field-shell">
            <Filter className="h-4 w-4" />
            <input
              value={tag}
              onChange={event => setTag(event.target.value)}
              placeholder="Tag, e.g. dp"
            />
          </label>
          <label className="field-shell">
            <Filter className="h-4 w-4" />
            <select
              value={source}
              onChange={event => setSource(event.target.value)}
            >
              <option value="all">Any source</option>
              <option value="codeforces">Codeforces</option>
            </select>
          </label>
          <label className="field-shell">
            <Filter className="h-4 w-4" />
            <select
              value={skillId}
              onChange={event => setSkillId(event.target.value)}
            >
              <option value="all">Any skill</option>
              {skillMap.data?.nodes.map(skill => (
                <option value={skill.id} key={skill.id}>
                  {skill.title}
                </option>
              ))}
            </select>
          </label>
          <label className="field-shell">
            <SlidersHorizontal className="h-4 w-4" />
            <select
              value={difficulty}
              onChange={event => setDifficulty(event.target.value)}
            >
              <option value="all">Any difficulty</option>
              <option value="800">800+</option>
              <option value="1200">1200+</option>
              <option value="1600">1600+</option>
              <option value="2000">2000+</option>
            </select>
          </label>
        </div>
      </section>
      {catalogue.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div
              key={i}
              className="h-52 animate-pulse rounded-2xl bg-white/[.04]"
            />
          ))}
        </div>
      ) : catalogue.error ? (
        <ErrorState message={catalogue.error.message} />
      ) : catalogue.data!.items.length ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {catalogue.data!.items.map(({ problem, progress }) => (
            <article key={problem.id} className="problem-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-mono text-indigo-200/80">
                    {problem.sourceId.toUpperCase()} ·{" "}
                    {problem.difficulty ?? "UNRATED"}
                  </p>
                  <h2 className="mt-3 line-clamp-2 text-lg font-medium tracking-tight text-slate-100">
                    {problem.title}
                  </h2>
                </div>
                <a
                  href={problem.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-white/[.06] hover:text-white"
                  aria-label="Open source"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {problem.tags.slice(0, 4).map(item => (
                  <span key={item} className="tag">
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-white/[.06] pt-4">
                <span className="text-xs text-slate-500">
                  {progress?.status?.replaceAll("_", " ") ?? "not started"}
                </span>
                <Link
                  href={`/problems/${problem.id}`}
                  className="text-sm text-indigo-200 hover:text-white"
                >
                  Open workspace →
                </Link>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="panel">
          <Empty
            text={
              sync.isSuccess
                ? "No imported problems match this filter."
                : "The catalogue is ready for an official metadata refresh. This imports only Codeforces metadata and links back to the source."
            }
            icon={Search}
            action={sync.isSuccess ? undefined : "Refresh Codeforces metadata"}
            href={undefined}
          />
        </div>
      )}
    </div>
  );
}
