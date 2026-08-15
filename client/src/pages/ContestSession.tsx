import React, { useEffect, useState } from "react";
import {
  Check,
  ChevronLeft,
  CirclePlay,
  ExternalLink,
  SkipForward,
} from "lucide-react";
import { Link, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { summarizeContestOutcomes } from "@shared/contestAnalysis";
import { ErrorState } from "./Home";

function formatRemainingTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function formatElapsedTime(totalSeconds: number | null) {
  if (totalSeconds === null) return "Unavailable";
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export default function ContestSession() {
  const [, params] = useRoute("/contests/:id");
  const sessionId = Number(params?.id);
  const utils = trpc.useUtils();
  const detail = trpc.olimp.contests.detail.useQuery(
    { sessionId },
    {
      enabled: Number.isInteger(sessionId) && sessionId > 0,
      refetchInterval: 30_000,
    }
  );
  const updateItem = trpc.olimp.contests.updateItem.useMutation({
    onSuccess: () => utils.olimp.contests.detail.invalidate({ sessionId }),
  });
  const [clockMs, setClockMs] = useState(() => Date.now());
  useEffect(() => {
    if (!detail.data?.timer?.expiresAt || detail.data.timer.isExpired) return;
    const timer = window.setInterval(() => setClockMs(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [detail.data?.timer?.expiresAt, detail.data?.timer?.isExpired]);

  if (detail.isLoading)
    return <div className="h-96 animate-pulse rounded-3xl bg-white/[.04]" />;
  if (detail.error || !detail.data)
    return (
      <ErrorState
        message={detail.error?.message ?? "Contest session not found."}
      />
    );

  const active =
    detail.data.items.find(({ item }) => item.status === "active") ?? null;
  const completedCount = detail.data.items.filter(
    ({ item }) => item.status === "completed"
  ).length;
  const analysis = summarizeContestOutcomes(
    detail.data.items.map(({ item }) => item.status)
  );
  const isExpired = detail.data.session.status === "expired";
  const deadlineMs = detail.data.timer.expiresAt?.getTime() ?? null;
  const remainingSeconds =
    deadlineMs === null
      ? detail.data.timer.remainingSeconds
      : Math.max(0, Math.ceil((deadlineMs - clockMs) / 1_000));
  const advance = (status: "completed" | "skipped") => {
    if (!active) return;
    updateItem.mutate({ sessionId, itemId: active.item.id, status });
  };

  return (
    <div className="max-w-5xl space-y-6">
      <Link
        href="/contests"
        className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" />
        All contests
      </Link>
      <section className="workspace-hero">
        <div className="relative z-10">
          <p className="eyebrow text-amber-200">
            VIRTUAL CONTEST · {completedCount}/{detail.data.items.length}{" "}
            COMPLETE
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] text-white">
            {detail.data.session.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-400">
            Ordered problem lifecycle with a server-derived deadline, factual
            score and elapsed-time penalty.
          </p>
          {detail.data.timer.expiresAt ? (
            <div className="mt-5 inline-flex items-end gap-3 rounded-2xl border border-amber-200/15 bg-amber-100/[.04] px-4 py-3">
              <div>
                <p className="eyebrow text-amber-200">TIME REMAINING</p>
                <p className="mt-1 font-mono text-2xl font-medium text-amber-50">
                  {formatRemainingTime(remainingSeconds ?? 0)}
                </p>
              </div>
              <p className="pb-1 text-xs text-slate-500">
                {detail.data.timer.durationMinutes} minute limit
              </p>
            </div>
          ) : null}
          <div className="mt-6 flex gap-1.5">
            {detail.data.items.map(({ item }) => (
              <span
                key={item.id}
                className={`h-1.5 flex-1 rounded-full ${item.status === "completed" ? "bg-emerald-300" : item.status === "active" ? "bg-amber-200" : item.status === "skipped" ? "bg-slate-600" : "bg-white/15"}`}
              />
            ))}
          </div>
        </div>
      </section>

      {detail.data.scoring.available ? (
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="panel">
            <p className="eyebrow">FACTUAL SCORE</p>
            <p className="mt-2 text-2xl font-medium text-slate-100">
              {detail.data.scoring.totalScore}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {detail.data.scoring.completedItems} completed items × 100 points
            </p>
          </div>
          <div className="panel">
            <p className="eyebrow">TIME PENALTY</p>
            <p className="mt-2 text-2xl font-medium text-slate-100">
              {detail.data.scoring.totalPenaltyMinutes} min
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Elapsed minutes for completed items
            </p>
          </div>
          <div className="panel">
            <p className="eyebrow">POLICY</p>
            <p className="mt-2 font-mono text-sm text-slate-200">
              {detail.data.scoring.calculationVersion}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              No wrong-attempt factor is recorded yet.
            </p>
          </div>
        </section>
      ) : null}

      {detail.data.session.status === "completed" || isExpired ? (
        <section className="panel">
          <p className="eyebrow">CONTEST FACTS</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-white/[.04] p-3">
              <p className="eyebrow">ELAPSED</p>
              <p className="mt-2 font-mono text-lg text-slate-100">
                {formatElapsedTime(detail.data.performance.elapsedSeconds)}
              </p>
            </div>
            <div className="rounded-xl bg-white/[.04] p-3">
              <p className="eyebrow">RESOLVED</p>
              <p className="mt-2 text-lg text-slate-100">
                {detail.data.performance.completionPercentage}%
              </p>
            </div>
            <div className="rounded-xl bg-white/[.04] p-3">
              <p className="eyebrow">TIMED COMPLETIONS</p>
              <p className="mt-2 text-lg text-slate-100">
                {detail.data.performance.validTimedCompletedItems}/
                {detail.data.performance.completedItems}
              </p>
            </div>
            <div className="rounded-xl bg-white/[.04] p-3">
              <p className="eyebrow">EVIDENCE</p>
              <p className="mt-2 text-sm text-slate-200">
                {detail.data.performance.elapsedEvidence ===
                "terminal_timestamp"
                  ? "Terminal timestamp"
                  : "Unavailable"}
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            This is a factual summary of persisted contest evidence. It does not
            infer rank, rating, skill or problem quality.
          </p>
        </section>
      ) : null}

      {detail.data.autopsy?.available ? (
        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">CONTEST AUTOPSY</p>
              <h3>
                {detail.data.autopsy.terminalOutcome === "all_items_resolved"
                  ? "All items resolved"
                  : "Deadline expired"}
              </h3>
            </div>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Ordered terminal evidence only; no cause, mistake, rank or skill is
            inferred.
          </p>
          <div className="mt-4 divide-y divide-white/[.06]">
            {detail.data.autopsy.trace.map(entry => (
              <div
                className="flex items-center justify-between gap-4 py-3"
                key={entry.itemId}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-200">
                    {entry.position + 1}. {entry.problemTitle}
                  </p>
                  <p className="mt-1 text-xs capitalize text-slate-500">
                    {entry.status}
                  </p>
                </div>
                <p className="shrink-0 font-mono text-xs text-slate-400">
                  {entry.completedElapsedSeconds === null
                    ? "No completed timestamp"
                    : formatElapsedTime(entry.completedElapsedSeconds)}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {isExpired ? (
        <section className="panel text-center">
          <p className="eyebrow">TIME EXPIRED</p>
          <h2 className="mt-3 text-2xl font-medium">
            This contest can no longer advance.
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            The deadline is persisted by the server. Factual score and timing
            evidence are shown above without a rank or performance conclusion.
          </p>
        </section>
      ) : active ? (
        <section className="grid gap-6 lg:grid-cols-[1fr_.35fr]">
          <div className="panel">
            <p className="eyebrow">
              CURRENT PROBLEM · {active.item.position + 1}
            </p>
            <h2 className="mt-3 text-2xl font-medium tracking-tight text-slate-100">
              {active.problem.title}
            </h2>
            <p className="mt-3 text-sm text-slate-500">
              {active.problem.sourceId} ·{" "}
              {active.problem.difficulty ?? "unrated"}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {active.problem.tags.map(tag => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/problems/${active.problem.id}`}
                className="primary-button"
              >
                <CirclePlay className="h-4 w-4" />
                Open private workspace
              </Link>
              <a
                href={active.problem.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="quiet-button"
              >
                <ExternalLink className="h-4 w-4" />
                Open source
              </a>
            </div>
          </div>
          <aside className="panel">
            <p className="eyebrow">ADVANCE</p>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Resolve the current item to move to the next problem. This records
              an explicit contest lifecycle fact, not a score or result.
            </p>
            <div className="mt-6 grid gap-2">
              <button
                type="button"
                onClick={() => advance("completed")}
                disabled={updateItem.isPending}
                className="primary-button"
              >
                <Check className="h-4 w-4" />
                Complete item
              </button>
              <button
                type="button"
                onClick={() => advance("skipped")}
                disabled={updateItem.isPending}
                className="quiet-button"
              >
                <SkipForward className="h-4 w-4" />
                Skip item
              </button>
            </div>
          </aside>
        </section>
      ) : detail.data.session.status === "completed" ? (
        <section className="panel text-center">
          <p className="eyebrow">SESSION COMPLETE</p>
          <h2 className="mt-3 text-2xl font-medium">
            Every contest item has been resolved.
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            This is a factual sequence and timing summary; it does not infer
            rank, rating or skill.
          </p>
          <div className="mx-auto mt-6 grid max-w-lg grid-cols-3 gap-3 text-left">
            <div className="rounded-xl bg-white/[.04] p-3">
              <p className="eyebrow">COMPLETED</p>
              <p className="mt-2 text-xl font-medium">{analysis.completed}</p>
            </div>
            <div className="rounded-xl bg-white/[.04] p-3">
              <p className="eyebrow">SKIPPED</p>
              <p className="mt-2 text-xl font-medium">{analysis.skipped}</p>
            </div>
            <div className="rounded-xl bg-white/[.04] p-3">
              <p className="eyebrow">RESOLVED</p>
              <p className="mt-2 text-xl font-medium">
                {analysis.completionRate ?? "—"}%
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="panel text-center">
          <p className="eyebrow">AWAITING START</p>
          <p className="mt-3 text-sm text-slate-400">
            Start this draft from the contest list to activate its first ordered
            problem.
          </p>
        </section>
      )}

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">SEQUENCE</p>
            <h3>Contest trace</h3>
          </div>
        </div>
        <div className="divide-y divide-white/[.06]">
          {detail.data.items.map(({ item, problem }) => (
            <div
              className="flex items-center justify-between gap-4 py-3"
              key={item.id}
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-slate-200">
                  {problem.title}
                </p>
                <p className="mt-1 text-xs capitalize text-slate-500">
                  {item.status}
                </p>
              </div>
              <span className="font-mono text-xs text-slate-600">
                {item.position + 1}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
