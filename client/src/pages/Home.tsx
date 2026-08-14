import { Link } from "wouter";
import {
  ArrowRight,
  CirclePlay,
  Compass,
  Flame,
  NotebookPen,
  Sparkles,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

const eventLabel: Record<string, string> = {
  attempt_started: "Started a new attempt",
  attempt_resumed: "Resumed an attempt",
  attempt_completed: "Completed an attempt",
  problem_status_changed: "Updated personal status",
  note_saved: "Saved a private note",
  codeforces_catalogue_synced: "Refreshed Codeforces catalogue",
};

export default function Home() {
  const dashboard = trpc.olimp.dashboard.useQuery();
  if (dashboard.isLoading) return <DashboardSkeleton />;
  if (dashboard.error) return <ErrorState message={dashboard.error.message} />;
  const data = dashboard.data!;
  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.09] bg-gradient-to-br from-[#182449] via-[#121a33] to-[#101524] p-7 shadow-[0_25px_70px_-35px_rgba(42,76,180,.8)] md:p-10">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="eyebrow text-indigo-200">TODAY’S FOCUS</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">
            Build momentum with one deliberate attempt.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
            Your workspace keeps the thread: the problem, your notes, the hint
            level you have reached, and the evidence behind progress.
          </p>
          {data.todayFocus ? (
            <Link
              href={`/problems/${data.todayFocus.problem.id}`}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-indigo-200 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-white"
            >
              Resume {data.todayFocus.problem.title}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href="/problems"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-indigo-200 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-white"
            >
              Find a first problem
              <Compass className="h-4 w-4" />
            </Link>
          )}
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        <Metric
          label="Solved this week"
          value={String(data.weeklySolved)}
          icon={Sparkles}
          accent="text-amber-200"
        />
        <Metric
          label="Active attempts"
          value={String(data.activeAttempts.length)}
          icon={CirclePlay}
          accent="text-cyan-200"
        />
        <Metric
          label="Weekly goal"
          value={`${data.weeklySolved}/${data.settings.weeklyGoal}`}
          icon={Flame}
          accent="text-rose-200"
        />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.55fr_.9fr]">
        <div className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">IN PROGRESS</p>
              <h3>Continue where you stopped</h3>
            </div>
            <Link
              href="/problems"
              className="text-sm text-indigo-200 hover:text-white"
            >
              Explore catalogue
            </Link>
          </div>
          {data.activeAttempts.length ? (
            <div className="divide-y divide-white/[0.06]">
              {data.activeAttempts.map(({ attempt, problem }) => (
                <Link
                  key={attempt.id}
                  href={`/problems/${problem.id}`}
                  className="group flex items-center justify-between gap-4 py-4 transition hover:px-2"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-100">
                      {problem.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {problem.sourceId} · {problem.difficulty ?? "unrated"} ·{" "}
                      {attempt.state}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-600 transition group-hover:text-indigo-200" />
                </Link>
              ))}
            </div>
          ) : (
            <Empty
              text="No active attempts yet. Start with a problem that matches your current focus."
              icon={NotebookPen}
              action="Explore problems"
              href="/problems"
            />
          )}
        </div>
        <div className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">RECENT TRACE</p>
              <h3>Activity, not noise</h3>
            </div>
          </div>
          {data.recentActivity.length ? (
            <div className="space-y-4">
              {data.recentActivity.map(event => (
                <div key={event.id} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-300" />
                  <div>
                    <p className="text-sm text-slate-300">
                      {eventLabel[event.eventType] ??
                        event.eventType.replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      {new Date(event.occurredAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              text="Your activity timeline will appear here as you work."
              icon={Sparkles}
            />
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: typeof Sparkles;
  accent: string;
}) {
  return (
    <div className="metric-card">
      <div>
        <p className="text-xs uppercase tracking-[.16em] text-slate-500">
          {label}
        </p>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-100">
          {value}
        </p>
      </div>
      <Icon className={`h-5 w-5 ${accent}`} />
    </div>
  );
}
export function Empty({
  text,
  icon: Icon,
  action,
  href,
}: {
  text: string;
  icon: typeof Sparkles;
  action?: string;
  href?: string;
}) {
  return (
    <div className="grid min-h-44 place-items-center py-6 text-center">
      <div className="max-w-xs">
        <Icon className="mx-auto h-5 w-5 text-slate-500" />
        <p className="mt-3 text-sm leading-6 text-slate-500">{text}</p>
        {action && href && (
          <Link
            href={href}
            className="mt-4 inline-block text-sm text-indigo-200 hover:text-white"
          >
            {action} →
          </Link>
        )}
      </div>
    </div>
  );
}
export function ErrorState({ message }: { message: string }) {
  return (
    <div className="panel grid min-h-64 place-items-center">
      <div className="text-center">
        <p className="eyebrow text-rose-200">UNAVAILABLE</p>
        <p className="mt-3 text-sm text-slate-400">{message}</p>
      </div>
    </div>
  );
}
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-72 rounded-[2rem] bg-white/[.04]" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 rounded-2xl bg-white/[.04]" />
        ))}
      </div>
    </div>
  );
}
