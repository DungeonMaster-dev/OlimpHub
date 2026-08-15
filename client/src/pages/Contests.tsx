import { Plus, Trophy } from "lucide-react";
import React, { useMemo, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Contests() {
  const [title, setTitle] = useState("Virtual contest");
  const [selected, setSelected] = useState<number[]>([]);
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [aiProposal, setAiProposal] = useState<{
    title: string;
    durationMinutes: number;
    problemIds: number[];
    rationale: string;
  } | null>(null);
  const utils = trpc.useUtils();
  const suggestionInput = useMemo(() => ({ count: 4 }), []);
  const catalogue = trpc.olimp.catalogue.list.useQuery({
    page: 0,
    pageSize: 24,
  });
  const suggestions = trpc.olimp.contests.suggest.useQuery(suggestionInput);
  const contests = trpc.olimp.contests.list.useQuery();
  const create = trpc.olimp.contests.create.useMutation({
    onSuccess: () => {
      setSelected([]);
      utils.olimp.contests.list.invalidate();
    },
  });
  const start = trpc.olimp.contests.start.useMutation({
    onSuccess: () => utils.olimp.contests.list.invalidate(),
  });
  const aiDraft = trpc.olimp.contests.aiDraft.useMutation({
    onSuccess: response => setAiProposal(response.proposal),
  });

  return (
    <div className="max-w-5xl space-y-6">
      <section className="workspace-hero">
        <p className="eyebrow text-indigo-200">PRIVATE VIRTUAL CONTESTS</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] text-white">
          Set a contest course.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Select canonical catalogue problems and save an ordered private
          contest. Timing, scoring and penalties are introduced separately after
          the session lifecycle is complete.
        </p>
      </section>
      <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <div className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">NEW CONTEST</p>
              <h3>Build a private set</h3>
            </div>
            <Trophy className="h-4 w-4 text-indigo-200" />
          </div>
          <input
            className="input-dark"
            aria-label="Contest title"
            value={title}
            onChange={event => setTitle(event.target.value)}
          />
          <label className="mt-4 block text-sm text-slate-300">
            Contest duration
            <select
              aria-label="Contest duration"
              className="input-dark mt-2"
              value={durationMinutes}
              onChange={event => setDurationMinutes(Number(event.target.value))}
            >
              <option value={60}>60 minutes</option>
              <option value={120}>120 minutes</option>
              <option value={180}>180 minutes</option>
              <option value={240}>240 minutes</option>
            </select>
          </label>
          <div className="mt-5 rounded-2xl border border-violet-200/15 bg-violet-200/[.035] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow text-violet-200">AI DRAFT</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Generates an editable proposal from eligible public catalogue
                  facts and saved progress categories only.
                </p>
              </div>
              <button
                type="button"
                className="quiet-button shrink-0 text-xs"
                disabled={aiDraft.isPending}
                onClick={() => aiDraft.mutate({ count: 4 })}
              >
                {aiDraft.isPending ? "Generating…" : "Generate AI draft"}
              </button>
            </div>
            {aiProposal ? (
              <div className="mt-4 border-t border-violet-100/10 pt-4">
                <p className="text-sm font-medium text-slate-200">
                  {aiProposal.title}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {aiProposal.durationMinutes} minutes ·{" "}
                  {aiProposal.problemIds.length} problems
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  {aiProposal.rationale}
                </p>
                <button
                  type="button"
                  className="quiet-button mt-3 text-xs"
                  onClick={() => {
                    setTitle(aiProposal.title);
                    setDurationMinutes(aiProposal.durationMinutes);
                    setSelected(aiProposal.problemIds);
                  }}
                >
                  Apply draft to form
                </button>
              </div>
            ) : null}
            {aiDraft.isError ? (
              <p
                className="mt-3 rounded-xl border border-rose-200/15 bg-rose-200/[.04] px-3 py-2 text-xs leading-5 text-rose-100"
                role="alert"
              >
                {aiDraft.error?.message ===
                "Not enough eligible catalogue problems for this draft."
                  ? "There are not enough eligible catalogue problems for this AI draft. Update your selection or complete an active contest, then try again."
                  : "AI draft generation could not produce a valid proposal. Your contest has not been created; try again or use the editable suggested set."}
              </p>
            ) : null}
          </div>
          <div className="mt-5 rounded-2xl border border-white/[.06] bg-white/[.02] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">SUGGESTED START</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Uses only your saved progress and avoids terminal work and
                  problems already in an active contest.
                </p>
              </div>
              <button
                type="button"
                className="quiet-button shrink-0 text-xs"
                disabled={!suggestions.data?.recommendations.length}
                onClick={() =>
                  setSelected(
                    suggestions.data?.recommendations.map(
                      recommendation => recommendation.problem.id
                    ) ?? []
                  )
                }
              >
                Use suggested set
              </button>
            </div>
            {suggestions.data?.recommendations.length ? (
              <div className="mt-3 divide-y divide-white/[.06]">
                {suggestions.data.recommendations.map(recommendation => (
                  <div
                    className="flex items-center justify-between gap-3 py-2"
                    key={recommendation.problem.id}
                  >
                    <p className="min-w-0 truncate text-xs text-slate-300">
                      {recommendation.problem.title}
                    </p>
                    <span className="max-w-48 text-right text-[11px] leading-4 text-slate-500">
                      {recommendation.reason}
                    </span>
                  </div>
                ))}
              </div>
            ) : suggestions.isLoading ? (
              <p className="mt-3 text-xs text-slate-500">
                Looking for eligible catalogue problems…
              </p>
            ) : (
              <p className="mt-3 text-xs text-slate-500">
                No eligible suggestion is available from current evidence.
              </p>
            )}
          </div>
          <div className="mt-5 space-y-2">
            {catalogue.data?.items.map(({ problem }) => (
              <label
                key={problem.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.02] p-3 text-sm text-slate-300"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(problem.id)}
                  onChange={() =>
                    setSelected(current =>
                      current.includes(problem.id)
                        ? current.filter(id => id !== problem.id)
                        : [...current, problem.id]
                    )
                  }
                />
                <span className="min-w-0 flex-1 truncate">{problem.title}</span>
                <span className="font-mono text-xs text-slate-600">
                  {problem.difficulty ?? "—"}
                </span>
              </label>
            ))}
          </div>
          <button
            onClick={() =>
              create.mutate({
                title,
                problemIds: selected,
                durationMinutes,
                requestId: crypto.randomUUID(),
              })
            }
            disabled={selected.length === 0 || create.isPending}
            className="primary-button mt-5"
          >
            <Plus className="h-4 w-4" /> Create draft contest
          </button>
        </div>
        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">YOUR CONTESTS</p>
              <h3>Saved private sessions</h3>
            </div>
          </div>
          {contests.data?.length ? (
            <div className="divide-y divide-white/[.06]">
              {contests.data.map(contest => (
                <div
                  key={contest.id}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <div>
                    <p className="text-sm text-slate-200">{contest.title}</p>
                    <p className="mt-1 text-xs capitalize text-slate-500">
                      {contest.status}
                    </p>
                  </div>
                  {contest.status === "draft" ? (
                    <button
                      type="button"
                      className="quiet-button text-xs"
                      disabled={start.isPending}
                      onClick={() => start.mutate({ sessionId: contest.id })}
                    >
                      Start contest
                    </button>
                  ) : (
                    <Link
                      href={`/contests/${contest.id}`}
                      className="quiet-button text-xs"
                    >
                      Open contest
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              No private contests yet. Create a draft from imported catalogue
              problems.
            </p>
          )}
        </section>
      </section>
    </div>
  );
}
