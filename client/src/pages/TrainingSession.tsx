import React from "react";
import {
  Check,
  ChevronLeft,
  CirclePlay,
  ExternalLink,
  SkipForward,
} from "lucide-react";
import { Link, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { ErrorState } from "./Home";

export default function TrainingSession() {
  const [, params] = useRoute("/training/:id");
  const sessionId = Number(params?.id);
  const utils = trpc.useUtils();
  const detail = trpc.olimp.training.detail.useQuery(
    { sessionId },
    { enabled: Number.isFinite(sessionId) }
  );
  const updateItem = trpc.olimp.training.updateItem.useMutation({
    onSuccess: () => utils.olimp.training.detail.invalidate({ sessionId }),
  });
  if (detail.isLoading)
    return <div className="h-96 animate-pulse rounded-3xl bg-white/[.04]" />;
  if (detail.error || !detail.data)
    return (
      <ErrorState
        message={detail.error?.message ?? "Training session not found."}
      />
    );
  const active =
    detail.data.items.find(({ item }) => item.status === "active") ??
    detail.data.items.find(({ item }) => item.status === "queued") ??
    null;
  const completedCount = detail.data.items.filter(
    ({ item }) => item.status === "completed"
  ).length;
  const advance = async (status: "completed" | "skipped") => {
    if (!active) return;
    await updateItem.mutateAsync({ sessionId, itemId: active.item.id, status });
  };
  return (
    <div className="max-w-5xl space-y-6">
      <Link
        href="/training"
        className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" />
        All training sessions
      </Link>
      <section className="workspace-hero">
        <div className="relative z-10">
          <p className="eyebrow text-indigo-200">
            ACTIVE TRAINING · {completedCount}/{detail.data.items.length}{" "}
            COMPLETE
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] text-white">
            {detail.data.session.title}
          </h1>
          <div className="mt-6 flex gap-1.5">
            {detail.data.items.map(({ item }) => (
              <span
                key={item.id}
                className={`h-1.5 flex-1 rounded-full ${item.status === "completed" ? "bg-emerald-300" : item.status === "active" ? "bg-indigo-200" : item.status === "skipped" ? "bg-slate-600" : "bg-white/15"}`}
              />
            ))}
          </div>
        </div>
      </section>
      {active ? (
        <section className="grid gap-6 lg:grid-cols-[1fr_.35fr]">
          <div className="panel">
            <p className="eyebrow">CURRENT ITEM · {active.item.position + 1}</p>
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
              Mark this training item when you are ready. Your personal problem
              status remains a separate, explicit choice.
            </p>
            <div className="mt-6 grid gap-2">
              <button
                onClick={() => advance("completed")}
                disabled={updateItem.isPending}
                className="primary-button"
              >
                <Check className="h-4 w-4" />
                Complete item
              </button>
              <button
                onClick={() => advance("skipped")}
                disabled={updateItem.isPending}
                className="quiet-button"
              >
                <SkipForward className="h-4 w-4" />
                Skip for now
              </button>
            </div>
          </aside>
        </section>
      ) : (
        <section className="panel text-center">
          <p className="eyebrow">SESSION COMPLETE</p>
          <h2 className="mt-3 text-2xl font-medium">
            Every item has been resolved.
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Review your attempts from the dashboard or create the next focused
            set.
          </p>
        </section>
      )}
      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">SEQUENCE</p>
            <h3>Training trace</h3>
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
