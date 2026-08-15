import {
  Activity,
  Bot,
  CheckCircle2,
  CirclePlay,
  Info,
  TrendingUp,
} from "lucide-react";
import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { ErrorState } from "./Home";

export default function Progress() {
  const [periodDays, setPeriodDays] = useState<7 | 30 | 90>(30);
  const summary = trpc.olimp.analytics.summary.useQuery({ periodDays });
  const timeline = trpc.olimp.analytics.timeline.useQuery({ periodDays });
  const activityStatistics = trpc.olimp.analytics.activityStatistics.useQuery();
  const activityStreak = trpc.olimp.analytics.activityStreak.useQuery();
  const factualAnalysis = trpc.olimp.ai.progressAnalysis.useQuery();
  if (summary.error) return <ErrorState message={summary.error.message} />;
  if (summary.isLoading || !summary.data)
    return <div className="h-96 animate-pulse rounded-3xl bg-white/[.04]" />;
  const { metrics, evidence, period, calculationVersion } = summary.data;
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
      <FactualProgressAnalysis
        analysis={factualAnalysis.data}
        loading={factualAnalysis.isLoading}
        error={factualAnalysis.error?.message}
      />
      {activityStatistics.error ? (
        <ErrorState message={activityStatistics.error.message} />
      ) : activityStatistics.isLoading || !activityStatistics.data ? (
        <div className="h-36 animate-pulse rounded-3xl bg-white/[.04]" />
      ) : (
        <ActivityStatistics statistics={activityStatistics.data.statistics} />
      )}
      {activityStreak.error ? (
        <ErrorState message={activityStreak.error.message} />
      ) : activityStreak.isLoading || !activityStreak.data ? (
        <div className="h-28 animate-pulse rounded-3xl bg-white/[.04]" />
      ) : (
        <ActivityStreak streak={activityStreak.data.streak} />
      )}
      {timeline.error ? (
        <ErrorState message={timeline.error.message} />
      ) : timeline.isLoading || !timeline.data ? (
        <div className="h-72 animate-pulse rounded-3xl bg-white/[.04]" />
      ) : (
        <section className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
          <RatingTimeline changes={timeline.data.ratingChanges} />
          <ActivityTimeline days={timeline.data.dailyActivity} />
        </section>
      )}
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

export function FactualProgressAnalysis({
  analysis,
  loading,
  error,
}: {
  analysis:
    | {
        calculationVersion: string;
        contextVersion: string;
        status: "available" | "insufficient_evidence";
        observations: Array<{
          code: string;
          count: number;
          label: string;
          detail: string;
        }>;
        evidence: {
          progressRecords: number;
          attempts: number;
          trainingSessions: number;
          contestSessions: number;
        };
        limitations: string[];
      }
    | undefined;
  loading: boolean;
  error?: string;
}) {
  if (loading)
    return (
      <section className="h-52 animate-pulse rounded-3xl bg-white/[.04]" />
    );
  if (error)
    return (
      <section className="panel" role="alert">
        <p className="eyebrow">AI-READY PROGRESS</p>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          The factual progress snapshot is unavailable right now. No coaching
          prompt was generated.
        </p>
      </section>
    );
  if (!analysis) return null;
  if (analysis.status === "insufficient_evidence")
    return (
      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">AI-READY PROGRESS</p>
            <h3>Awaiting recorded learning evidence</h3>
          </div>
          <Bot className="h-5 w-5 text-indigo-200" />
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-400">
          No saved progress records, attempts or sessions are available yet.
          This is an evidence state, not a judgment about your learning.
        </p>
      </section>
    );
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">AI-READY PROGRESS</p>
          <h3>Current learning evidence</h3>
        </div>
        <span className="tag">{analysis.calculationVersion}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        This is a deterministic snapshot of persisted statuses. It does not
        predict ability, ranking, rating or future outcomes.
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {analysis.observations.map(observation => (
          <div
            key={observation.code}
            className="rounded-xl border border-white/[.06] bg-white/[.02] p-4"
          >
            <p className="text-xs uppercase tracking-[.16em] text-slate-500">
              {observation.label}
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-100">
              {observation.count}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {observation.detail}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs leading-5 text-slate-600">
        Evidence basis: {analysis.evidence.progressRecords} progress records ·{" "}
        {analysis.evidence.attempts} attempts ·{" "}
        {analysis.evidence.trainingSessions} training sessions ·{" "}
        {analysis.evidence.contestSessions} contest sessions. Context:{" "}
        {analysis.contextVersion}.
      </p>
    </section>
  );
}

function ActivityStatistics({
  statistics,
}: {
  statistics: {
    day: { eventCount: number; activeMinutes: number; solvedUpdates: number };
    week: { eventCount: number; activeMinutes: number; solvedUpdates: number };
    month: { eventCount: number; activeMinutes: number; solvedUpdates: number };
  };
}) {
  const periods = [
    { label: "Today", value: statistics.day },
    { label: "This week", value: statistics.week },
    { label: "This month", value: statistics.month },
  ];
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">FACTUAL RHYTHM</p>
          <h3>Calendar statistics</h3>
        </div>
        <span className="tag">UTC calendar</span>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {periods.map(period => (
          <div
            key={period.label}
            className="rounded-xl border border-white/[.06] bg-white/[.02] p-4"
          >
            <p className="text-xs uppercase tracking-[.16em] text-slate-500">
              {period.label}
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-100">
              {period.value.activeMinutes}m
            </p>
            <p className="mt-1 text-xs text-slate-500">active editor time</p>
            <p className="mt-3 text-sm text-slate-300">
              {period.value.eventCount} events · {period.value.solvedUpdates}{" "}
              solved updates
            </p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">
        Active time is derived from server-bounded one-minute editor heartbeats.
        Events and solved updates are persisted workspace facts.
      </p>
    </section>
  );
}

function ActivityStreak({
  streak,
}: {
  streak: {
    currentDays: number;
    activeToday: boolean;
    lastActiveDate: string | null;
  };
}) {
  return (
    <section className="panel flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <p className="eyebrow">ACTIVE-DAY STREAK</p>
        <h3 className="mt-2">{streak.currentDays} consecutive days</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {streak.activeToday
            ? "Today already has a persisted workspace activity fact."
            : streak.currentDays
              ? "Continue this streak with a persisted workspace activity fact today."
              : "Start a new streak with a persisted workspace activity fact."}
        </p>
      </div>
      <span className="tag">
        {streak.activeToday
          ? "active today"
          : streak.lastActiveDate
            ? `last active ${streak.lastActiveDate}`
            : "no activity yet"}
      </span>
    </section>
  );
}

function RatingTimeline({
  changes,
}: {
  changes: Array<{ ratedAt: Date; newRating: number; contestName: string }>;
}) {
  if (!changes.length)
    return (
      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">CODEFORCES RATING</p>
            <h3>Rating timeline</h3>
          </div>
          <TrendingUp className="h-5 w-5 text-indigo-200" />
        </div>
        <p className="py-12 text-sm leading-6 text-slate-500">
          No imported rating changes in this period. Link a public handle and
          synchronize rating history to show factual contest points.
        </p>
      </section>
    );
  const ratings = changes.map(change => change.newRating);
  const minimum = Math.min(...ratings);
  const span = Math.max(Math.max(...ratings) - minimum, 1);
  const pointFor = (change: (typeof changes)[number], index: number) => ({
    x: changes.length === 1 ? 50 : (index / (changes.length - 1)) * 100,
    y: 88 - ((change.newRating - minimum) / span) * 70,
  });
  const points = changes
    .map((change, index) => {
      const point = pointFor(change, index);
      return `${point.x},${point.y}`;
    })
    .join(" ");
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">CODEFORCES RATING</p>
          <h3>Rating timeline</h3>
        </div>
        <span className="tag">{changes.at(-1)!.newRating} current</span>
      </div>
      <svg
        className="mt-6 h-48 w-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        role="img"
        aria-label="Codeforces rating changes over the selected period"
      >
        <path d="M0 88 H100" stroke="rgba(148,163,184,.2)" strokeWidth="1" />
        <polyline
          fill="none"
          points={points}
          stroke="rgb(165 180 252)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        {changes.map((change, index) => {
          const point = pointFor(change, index);
          return (
            <circle
              key={`${change.contestName}-${change.ratedAt.toISOString()}`}
              cx={point.x}
              cy={point.y}
              r="2"
              fill="rgb(224 231 255)"
            >
              <title>{`${change.contestName}: ${change.newRating}`}</title>
            </circle>
          );
        })}
      </svg>
      <div className="flex justify-between text-xs text-slate-500">
        <span>{changes[0]!.ratedAt.toLocaleDateString()}</span>
        <span>{changes.at(-1)!.ratedAt.toLocaleDateString()}</span>
      </div>
    </section>
  );
}

function ActivityTimeline({
  days,
}: {
  days: Array<{ date: string; activityCount: number; solvedUpdates: number }>;
}) {
  const maxActivity = Math.max(...days.map(day => day.activityCount), 1);
  const totalSolved = days.reduce((sum, day) => sum + day.solvedUpdates, 0);
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">WORKSPACE RHYTHM</p>
          <h3>Daily activity</h3>
        </div>
        <span className="tag">{totalSolved} solved updates</span>
      </div>
      <div
        className="mt-8 flex h-48 items-end gap-1"
        aria-label="Daily recorded workspace activity"
      >
        {days.map(day => (
          <div key={day.date} className="group flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t-sm bg-indigo-300/70 transition-colors group-hover:bg-indigo-100"
              style={{
                height: `${Math.max((day.activityCount / maxActivity) * 100, day.activityCount ? 4 : 1)}%`,
              }}
              title={`${day.date}: ${day.activityCount} events, ${day.solvedUpdates} solved updates`}
            />
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">
        Bars count persisted workspace events. Solved updates are explicit
        status changes, not inferred verdicts.
      </p>
    </section>
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
