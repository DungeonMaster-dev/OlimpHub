import React, { useState } from "react";
import { Bell, Database, Eye, Link2, Save, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { ErrorState } from "./Home";

type InitialSettings = {
  settings: {
    timeZone: string;
    weeklyGoal: number;
    activityTracking: "enabled" | "minimal";
    notificationOptIn: "enabled" | "disabled";
    analyticsPeriodDays: number;
    analyticsRetentionDays: number;
    updatedAt: Date;
  };
  codeforces: {
    handle: string;
    verificationStatus: string;
    dailySyncEnabled: "enabled" | "disabled";
    dailySyncLastRunAt: Date | null;
  } | null;
};

type AIContext = {
  contextVersion: string;
  progressByStatus: Record<string, number>;
  attemptsByState: Record<string, number>;
  trainingSessionsByStatus: Record<string, number>;
  contestSessionsByStatus: Record<string, number>;
  excludedData: string[];
};

function totalCount(values: Record<string, number>) {
  return Object.values(values).reduce((total, value) => total + value, 0);
}

export function AIContextPreview({
  context,
  loading,
  error,
}: {
  context: AIContext | undefined;
  loading: boolean;
  error: string | null;
}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">AI CONTEXT</p>
          <h3>Minimal factual preview</h3>
        </div>
        <Database className="h-4 w-4 text-violet-200" />
      </div>
      {loading ? (
        <div className="mt-4 h-20 animate-pulse rounded-xl bg-white/[.04]" />
      ) : error ? (
        <p className="mt-3 text-xs leading-5 text-rose-200" role="alert">
          AI context preview is unavailable. No data was sent to an AI feature.
        </p>
      ) : context ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-white/[.04] p-3">
              <p className="eyebrow">PROGRESS RECORDS</p>
              <p className="mt-2 text-xl font-medium text-slate-100">
                {totalCount(context.progressByStatus)}
              </p>
            </div>
            <div className="rounded-xl bg-white/[.04] p-3">
              <p className="eyebrow">ATTEMPTS</p>
              <p className="mt-2 text-xl font-medium text-slate-100">
                {totalCount(context.attemptsByState)}
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            {context.contextVersion} contains status counts and workspace
            preferences only. It excludes notes, source code, raw activity,
            external handles and session credentials.
          </p>
        </>
      ) : null}
    </section>
  );
}

function normalizeRetentionDays(value: number): 30 | 90 | 365 {
  return value === 30 || value === 365 ? value : 90;
}

export default function Settings() {
  const settings = trpc.olimp.settings.get.useQuery();
  const aiContext = trpc.olimp.ai.context.useQuery();
  if (settings.error) return <ErrorState message={settings.error.message} />;
  if (settings.isLoading || !settings.data)
    return <div className="h-96 animate-pulse rounded-3xl bg-white/[.04]" />;
  return (
    <SettingsForm
      key={String(settings.data.settings.updatedAt)}
      initial={settings.data}
      aiContext={aiContext.data}
      aiContextLoading={aiContext.isLoading}
      aiContextError={aiContext.error?.message ?? null}
    />
  );
}

function SettingsForm({
  initial,
  aiContext,
  aiContextLoading,
  aiContextError,
}: {
  initial: InitialSettings;
  aiContext: AIContext | undefined;
  aiContextLoading: boolean;
  aiContextError: string | null;
}) {
  const utils = trpc.useUtils();
  const [handle, setHandle] = useState(initial.codeforces?.handle ?? "");
  const [timeZone, setTimeZone] = useState(initial.settings.timeZone);
  const [goal, setGoal] = useState(initial.settings.weeklyGoal);
  const [tracking, setTracking] = useState(initial.settings.activityTracking);
  const [notifications, setNotifications] = useState(
    initial.settings.notificationOptIn
  );
  const [period, setPeriod] = useState<7 | 30 | 90>(
    initial.settings.analyticsPeriodDays as 7 | 30 | 90
  );
  const [retentionDays, setRetentionDays] = useState<30 | 90 | 365>(
    normalizeRetentionDays(initial.settings.analyticsRetentionDays)
  );
  const [purgeConfirmation, setPurgeConfirmation] = useState("");
  const save = trpc.olimp.settings.update.useMutation({
    onSuccess: () => {
      utils.olimp.settings.get.invalidate();
      utils.olimp.analytics.invalidate();
      utils.olimp.dashboard.invalidate();
    },
  });
  const purgeActivityHistory =
    trpc.olimp.settings.purgeActivityHistory.useMutation({
      onSuccess: () => {
        setPurgeConfirmation("");
        utils.olimp.analytics.invalidate();
        utils.olimp.dashboard.invalidate();
      },
    });
  const setCf = trpc.olimp.settings.setCodeforcesHandle.useMutation({
    onSuccess: () => utils.olimp.settings.get.invalidate(),
  });
  const sync = trpc.olimp.codeforces.syncSubmissions.useMutation();
  const syncRatingHistory =
    trpc.olimp.codeforces.syncRatingHistory.useMutation();
  const dailySync =
    trpc.olimp.settings.setDailyCodeforcesProfileSync.useMutation({
      onSuccess: () => utils.olimp.settings.get.invalidate(),
    });
  return (
    <div className="max-w-4xl space-y-7">
      <section>
        <p className="eyebrow">SETTINGS</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em]">
          Keep control of your data and channels.
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Integration handles are declared publicly; privacy and notification
          preferences are stored only in your private workspace.
        </p>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">CODEFORCES</p>
              <h3>Link your public handle</h3>
            </div>
            <Link2 className="h-4 w-4 text-indigo-200" />
          </div>
          <label className="label">
            Public handle
            <input
              className="input-dark mt-2"
              value={handle}
              onChange={event => setHandle(event.target.value)}
              placeholder="tourist"
            />
          </label>
          <button
            onClick={() => setCf.mutate({ handle })}
            disabled={!handle || setCf.isPending}
            className="primary-button mt-4"
          >
            <Save className="h-4 w-4" />
            {setCf.isPending ? "Checking Codeforces…" : "Verify & link handle"}
          </button>
          {setCf.error && (
            <p className="mt-3 text-sm text-rose-200">{setCf.error.message}</p>
          )}
          {initial.codeforces && (
            <div className="mt-5 rounded-xl border border-white/[.06] bg-white/[.02] p-4 text-sm text-slate-400">
              <p>
                {initial.codeforces.handle} ·{" "}
                {initial.codeforces.verificationStatus.replaceAll("_", " ")}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                The public profile exists on Codeforces. This does not prove
                ownership of that external account.
              </p>
              <button
                onClick={() => sync.mutate()}
                disabled={sync.isPending}
                className="mt-3 text-indigo-200 hover:text-white"
              >
                {sync.isPending
                  ? "Syncing public verdicts…"
                  : "Sync public verdicts →"}
              </button>
              {sync.error && (
                <p className="mt-2 text-xs text-rose-200">
                  {sync.error.message}
                </p>
              )}
              <button
                onClick={() => syncRatingHistory.mutate()}
                disabled={syncRatingHistory.isPending}
                className="mt-3 block text-indigo-200 hover:text-white"
              >
                {syncRatingHistory.isPending
                  ? "Syncing rating history…"
                  : "Sync rating & contests →"}
              </button>
              {syncRatingHistory.isSuccess && (
                <p className="mt-2 text-xs text-emerald-200">
                  Rating history synchronized.
                </p>
              )}
              {syncRatingHistory.error && (
                <p className="mt-2 text-xs text-rose-200">
                  {syncRatingHistory.error.message}
                </p>
              )}
              <button
                onClick={() =>
                  dailySync.mutate({
                    enabled: initial.codeforces!.dailySyncEnabled !== "enabled",
                  })
                }
                disabled={dailySync.isPending}
                className="mt-3 block text-indigo-200 hover:text-white"
              >
                {dailySync.isPending
                  ? "Updating daily sync…"
                  : initial.codeforces.dailySyncEnabled === "enabled"
                    ? "Pause daily profile sync"
                    : "Enable daily profile sync"}
              </button>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Runs once per day after the site is published. It imports only
                public verdicts and rating history for this declared handle.
              </p>
              {dailySync.error && (
                <p className="mt-2 text-xs text-rose-200">
                  {dailySync.error.message}
                </p>
              )}
            </div>
          )}
        </section>
        <AIContextPreview
          context={aiContext}
          loading={aiContextLoading}
          error={aiContextError}
        />
        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">PRIVACY</p>
              <h3>Activity preferences</h3>
            </div>
            <Eye className="h-4 w-4 text-cyan-200" />
          </div>
          <label className="label">
            Tracking level
            <select
              className="input-dark mt-2"
              value={tracking}
              onChange={event =>
                setTracking(event.target.value as "enabled" | "minimal")
              }
            >
              <option value="enabled">Detailed activity events</option>
              <option value="minimal">Minimal workspace facts</option>
            </select>
          </label>
          <label className="label mt-4">
            Analytics period
            <select
              className="input-dark mt-2"
              value={period}
              onChange={event =>
                setPeriod(Number(event.target.value) as 7 | 30 | 90)
              }
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </label>
          <label className="label mt-4">
            Activity retention
            <select
              className="input-dark mt-2"
              value={retentionDays}
              onChange={event =>
                setRetentionDays(Number(event.target.value) as 30 | 90 | 365)
              }
            >
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={365}>365 days</option>
            </select>
          </label>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            The selected window limits private activity shown in analytics.
            Saving a shorter window permanently removes older activity facts.
          </p>
          <div className="mt-5 rounded-xl border border-rose-200/15 bg-rose-400/[.04] p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-rose-100">
              <Trash2 className="h-4 w-4" />
              Delete activity history
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              This permanently removes your private activity-event history. It
              does not delete notes, attempts, problem progress, or imported
              public submissions.
            </p>
            <label className="label mt-3 text-xs">
              Type DELETE_ACTIVITY_HISTORY to confirm
              <input
                className="input-dark mt-2"
                value={purgeConfirmation}
                onChange={event => setPurgeConfirmation(event.target.value)}
                placeholder="DELETE_ACTIVITY_HISTORY"
              />
            </label>
            <button
              onClick={() =>
                purgeActivityHistory.mutate({
                  confirmation: "DELETE_ACTIVITY_HISTORY",
                })
              }
              disabled={
                purgeConfirmation !== "DELETE_ACTIVITY_HISTORY" ||
                purgeActivityHistory.isPending
              }
              className="mt-3 text-sm text-rose-200 transition hover:text-rose-100 disabled:opacity-40"
            >
              {purgeActivityHistory.isPending
                ? "Deleting activity history…"
                : "Permanently delete activity history"}
            </button>
            {purgeActivityHistory.error && (
              <p className="mt-2 text-xs text-rose-200">
                {purgeActivityHistory.error.message}
              </p>
            )}
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">PRACTICE</p>
              <h3>Weekly rhythm</h3>
            </div>
            <Database className="h-4 w-4 text-amber-200" />
          </div>
          <label className="label">
            Time zone
            <input
              className="input-dark mt-2"
              value={timeZone}
              onChange={event => setTimeZone(event.target.value)}
              placeholder="Europe/Moscow"
            />
          </label>
          <label className="label mt-4">
            Weekly solved goal
            <input
              className="input-dark mt-2"
              type="number"
              min={1}
              max={30}
              value={goal}
              onChange={event => setGoal(Number(event.target.value))}
            />
          </label>
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">NOTIFICATIONS</p>
              <h3>Opt in deliberately</h3>
            </div>
            <Bell className="h-4 w-4 text-rose-200" />
          </div>
          <label className="label">
            Notification preference
            <select
              className="input-dark mt-2"
              value={notifications}
              onChange={event =>
                setNotifications(event.target.value as "enabled" | "disabled")
              }
            >
              <option value="disabled">Disabled</option>
              <option value="enabled">Opted in</option>
            </select>
          </label>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            No delivery channel is connected until you explicitly configure one.
            This setting records preference only.
          </p>
        </section>
      </div>
      <button
        onClick={() =>
          save.mutate({
            timeZone,
            weeklyGoal: goal,
            activityTracking: tracking,
            notificationOptIn: notifications,
            analyticsPeriodDays: period,
            analyticsRetentionDays: retentionDays,
          })
        }
        disabled={save.isPending}
        className="primary-button"
      >
        <Save className="h-4 w-4" />
        Save workspace preferences
      </button>
    </div>
  );
}
