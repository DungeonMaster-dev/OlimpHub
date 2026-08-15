import React, { useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, ListPlus, Play, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Empty, ErrorState } from "./Home";

export default function Training() {
  const sessions = trpc.olimp.training.list.useQuery();
  const catalogue = trpc.olimp.catalogue.list.useQuery({
    page: 0,
    pageSize: 8,
  });
  const utils = trpc.useUtils();
  const [selected, setSelected] = useState<number[]>([]);
  const [title, setTitle] = useState("Focused practice");
  const create = trpc.olimp.training.create.useMutation({
    onSuccess: () => {
      setSelected([]);
      utils.olimp.training.list.invalidate();
    },
  });
  if (sessions.error) return <ErrorState message={sessions.error.message} />;
  return (
    <div className="space-y-7">
      <section>
        <p className="eyebrow">TRAINING SESSIONS</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em]">
          Make a small set worth finishing.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Create a focused sequence from the catalogue, move through one item at
          a time, and keep completion separate from your long-term personal
          status.
        </p>
      </section>
      <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <div className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">NEW SESSION</p>
              <h3>Curate your focus</h3>
            </div>
            <ListPlus className="h-4 w-4 text-indigo-200" />
          </div>
          <input
            className="input-dark"
            value={title}
            onChange={event => setTitle(event.target.value)}
            aria-label="Session title"
          />
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
            )) ?? (
              <p className="text-sm text-slate-500">
                Refresh the catalogue to select real problems.
              </p>
            )}
          </div>
          <button
            onClick={() =>
              create.mutate({
                title,
                problemIds: selected,
                requestId: crypto.randomUUID(),
              })
            }
            disabled={!selected.length || create.isPending}
            className="primary-button mt-5"
          >
            <Plus className="h-4 w-4" />
            Create session
          </button>
        </div>
        <div className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">YOUR SESSIONS</p>
              <h3>Deliberate sequences</h3>
            </div>
          </div>
          {sessions.isLoading ? (
            <div className="h-32 animate-pulse rounded-xl bg-white/[.04]" />
          ) : sessions.data?.length ? (
            <div className="divide-y divide-white/[.06]">
              {sessions.data.map(session => (
                <Link
                  key={session.id}
                  href={`/training/${session.id}`}
                  className="group flex items-center justify-between gap-4 py-4"
                >
                  <div>
                    <p className="font-medium text-slate-200">
                      {session.title}
                    </p>
                    <p className="mt-1 text-xs capitalize text-slate-500">
                      {session.status} · created{" "}
                      {new Date(session.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Play className="h-4 w-4 text-slate-600 group-hover:text-indigo-200" />
                </Link>
              ))}
            </div>
          ) : (
            <Empty
              text="No session yet. Select a few imported problems to create a focused training set."
              icon={CheckCircle2}
            />
          )}
        </div>
      </section>
    </div>
  );
}

export function TrainingDetail() {
  return (
    <div className="panel">
      <p className="eyebrow">TRAINING DETAIL</p>
      <h1 className="mt-2 text-2xl font-semibold">
        Open a session from the list to continue.
      </h1>
    </div>
  );
}
