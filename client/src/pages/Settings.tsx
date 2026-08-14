import { useState } from "react";
import { Bell, Database, Eye, Link2, Save } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { ErrorState } from "./Home";

type InitialSettings = {
  settings: {
    timeZone: string;
    weeklyGoal: number;
    activityTracking: "enabled" | "minimal";
    notificationOptIn: "enabled" | "disabled";
    analyticsPeriodDays: number;
    updatedAt: Date;
  };
  codeforces: { handle: string; verificationStatus: string } | null;
};

export default function Settings() {
  const settings = trpc.olimp.settings.get.useQuery();
  if (settings.error) return <ErrorState message={settings.error.message} />;
  if (settings.isLoading || !settings.data)
    return <div className="h-96 animate-pulse rounded-3xl bg-white/[.04]" />;
  return (
    <SettingsForm
      key={String(settings.data.settings.updatedAt)}
      initial={settings.data}
    />
  );
}

function SettingsForm({ initial }: { initial: InitialSettings }) {
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
  const save = trpc.olimp.settings.update.useMutation({
    onSuccess: () => utils.olimp.settings.get.invalidate(),
  });
  const setCf = trpc.olimp.settings.setCodeforcesHandle.useMutation({
    onSuccess: () => utils.olimp.settings.get.invalidate(),
  });
  const sync = trpc.olimp.codeforces.syncSubmissions.useMutation();
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
            Save handle
          </button>
          {initial.codeforces && (
            <div className="mt-5 rounded-xl border border-white/[.06] bg-white/[.02] p-4 text-sm text-slate-400">
              <p>
                {initial.codeforces.handle} ·{" "}
                {initial.codeforces.verificationStatus.replaceAll("_", " ")}
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
            </div>
          )}
        </section>
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
