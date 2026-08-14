import { useState } from "react";
import { Activity, CheckCircle2, CirclePlay, Info } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { ErrorState } from "./Home";

export default function Progress() {
  const [periodDays, setPeriodDays] = useState<7 | 30 | 90>(30);
  const summary = trpc.olimp.analytics.summary.useQuery({ periodDays });
  if (summary.error) return <ErrorState message={summary.error.message} />;
  if (summary.isLoading)
    return <div className="h-96 animate-pulse rounded-3xl bg-white/[.04]" />;
  const { metrics, evidence, period, calculationVersion } = summary.data!;
  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">EXPLAINABLE PROGRESS</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em]">
            Metrics with their working shown.
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Every number is calculated from recorded facts and paired with the
            reason it exists.
          </p>
        </div>
        <div className="segmented">
          {([7, 30, 90] as const).map(days => (
            <button
              key={days}
              onClick={() => setPeriodDays(days)}
              className={periodDays === days ? "active" : ""}
            >
              {days}d
            </button>
          ))}
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Solved"
          value={metrics.solvedProblems}
          icon={CheckCircle2}
        />
        <Metric
          label="Attempts started"
          value={metrics.startedAttempts}
          icon={CirclePlay}
        />
        <Metric
          label="Open attempts"
          value={metrics.activeAttempts}
          icon={Activity}
        />
        <Metric
          label="Recorded events"
          value={metrics.trackedEvents}
          icon={Info}
        />
      </section>
      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">EVIDENCE LEDGER</p>
            <h3>Why these metrics are shown</h3>
          </div>
          <span className="text-xs text-slate-600">
            {calculationVersion} · {period.days} days
          </span>
        </div>
        <div className="space-y-3">
          {evidence.map(item => (
            <div
              key={item.metricKey}
              className="rounded-xl border border-white/[.06] bg-white/[.02] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-200">
                  {item.metricKey}
                </p>
                <span className="tag">
                  {item.reasonCode.replaceAll("_", " ")}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-slate-600">
          Calculation period: {period.startsAt.toLocaleDateString()} –{" "}
          {period.endsAt.toLocaleDateString()}. Empty evidence means
          insufficient recorded data, not a negative result.
        </p>
      </section>
    </div>
  );
}
function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Activity;
}) {
  return (
    <div className="metric-card">
      <div>
        <p className="text-xs uppercase tracking-[.16em] text-slate-500">
          {label}
        </p>
        <p className="mt-3 text-3xl font-semibold text-slate-100">{value}</p>
      </div>
      <Icon className="h-5 w-5 text-indigo-200" />
    </div>
  );
}
