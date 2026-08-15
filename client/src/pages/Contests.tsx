import { Plus, Trophy } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Contests() {
  const [title, setTitle] = useState("Virtual contest");
  const [selected, setSelected] = useState<number[]>([]);
  const utils = trpc.useUtils();
  const catalogue = trpc.olimp.catalogue.list.useQuery({
    page: 0,
    pageSize: 8,
  });
  const contests = trpc.olimp.contests.list.useQuery();
  const create = trpc.olimp.contests.create.useMutation({
    onSuccess: () => {
      setSelected([]);
      utils.olimp.contests.list.invalidate();
    },
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
                <Link
                  key={contest.id}
                  href={`/contests/${contest.id}`}
                  className="block py-4"
                >
                  <p className="text-sm text-slate-200">{contest.title}</p>
                  <p className="mt-1 text-xs capitalize text-slate-500">
                    {contest.status}
                  </p>
                </Link>
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
