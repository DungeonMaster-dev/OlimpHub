import { useState } from "react";
import { Link, useRoute } from "wouter";
import React, { useEffect, useRef } from "react";
import {
  ArrowLeft,
  Check,
  CirclePause,
  CirclePlay,
  ExternalLink,
  Lightbulb,
  Loader2,
  NotebookPen,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  editorActiveHeartbeatMs,
  editorIdleAfterMs,
} from "@shared/activityTracking";
import { ErrorState } from "./Home";

export default function Workspace() {
  const [, params] = useRoute("/problems/:id");
  const problemId = Number(params?.id);
  const utils = trpc.useUtils();
  const detail = trpc.olimp.catalogue.detail.useQuery(
    { problemId },
    { enabled: Number.isFinite(problemId) }
  );
  const start = trpc.olimp.workspace.start.useMutation({
    onSuccess: () => utils.olimp.catalogue.detail.invalidate({ problemId }),
  });
  const { mutate: recordPageActivity } =
    trpc.olimp.workspace.recordPageActivity.useMutation();
  const { mutate: recordEditorActivity } =
    trpc.olimp.workspace.recordEditorActivity.useMutation();
  const editorFocusedRef = useRef(false);
  const editorIdleRef = useRef(false);
  const lastEditorInputAtRef = useRef(0);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [editedNote, setEditedNote] = useState<string | null>(null);
  const [hint, setHint] = useState<{ level: number; content: string } | null>(
    null
  );
  const notes = trpc.olimp.workspace.notes.useQuery(
    { problemId },
    { enabled: Number.isFinite(problemId) }
  );
  const note = editedNote ?? notes.data?.[0]?.content ?? "";
  const saveNote = trpc.olimp.workspace.saveNote.useMutation({
    onSuccess: () => utils.olimp.workspace.notes.invalidate({ problemId }),
  });
  const setState = trpc.olimp.workspace.setAttemptState.useMutation({
    onSuccess: () => utils.olimp.catalogue.detail.invalidate({ problemId }),
  });
  const setStatus = trpc.olimp.workspace.setStatus.useMutation({
    onSuccess: () => utils.olimp.catalogue.detail.invalidate({ problemId }),
  });
  const nextHint = trpc.olimp.workspace.nextHint.useMutation({
    onSuccess: data => setHint(data),
  });
  useEffect(() => {
    const loadedProblemId = detail.data?.problem.id;
    if (!loadedProblemId) return;
    recordPageActivity({
      problemId: loadedProblemId,
      clientEventId: crypto.randomUUID(),
    });
  }, [detail.data?.problem.id, recordPageActivity]);
  useEffect(() => {
    const heartbeat = window.setInterval(() => {
      if (!editorFocusedRef.current) return;
      const elapsedMs = Date.now() - lastEditorInputAtRef.current;
      if (elapsedMs >= editorIdleAfterMs) {
        if (!editorIdleRef.current) {
          recordEditorActivity({
            problemId,
            phase: "idle",
            clientEventId: crypto.randomUUID(),
          });
          editorIdleRef.current = true;
        }
        return;
      }
      recordEditorActivity({
        problemId,
        phase: "active",
        clientEventId: crypto.randomUUID(),
      });
    }, editorActiveHeartbeatMs);
    return () => window.clearInterval(heartbeat);
  }, [problemId, recordEditorActivity]);
  if (detail.isLoading)
    return <div className="h-64 animate-pulse rounded-3xl bg-white/[.04]" />;
  if (detail.error || !detail.data)
    return (
      <ErrorState message={detail.error?.message ?? "Problem not found."} />
    );
  const { problem, progress, skills } = detail.data;
  const launch = async () => {
    const attempt = await start.mutateAsync({ problemId });
    setAttemptId(attempt.id);
  };
  return (
    <div className="space-y-6">
      <Link
        href="/problems"
        className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to catalogue
      </Link>
      <section className="workspace-hero">
        <div className="relative z-10 max-w-3xl">
          <p className="eyebrow text-indigo-200">
            {problem.sourceId} · {problem.difficulty ?? "UNRATED"}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] text-white md:text-4xl">
            {problem.title}
          </h1>
          <div className="mt-5 flex flex-wrap gap-2">
            {problem.tags.map(tag => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={problem.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="primary-button"
            >
              <ExternalLink className="h-4 w-4" />
              Open on Codeforces
            </a>
            <button
              onClick={launch}
              disabled={start.isPending}
              className="quiet-button"
            >
              {start.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CirclePlay className="h-4 w-4" />
              )}
              {progress?.status === "in_progress"
                ? "Resume attempt"
                : "Start attempt"}
            </button>
          </div>
        </div>
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-6">
          <div className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">PRIVATE WORKLOG</p>
                <h3>Capture the shape of your thinking</h3>
              </div>
              <NotebookPen className="h-4 w-4 text-slate-500" />
            </div>
            <textarea
              className="min-h-52 w-full resize-y rounded-xl border border-white/[.08] bg-black/15 p-4 text-sm leading-6 text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-indigo-300/50"
              value={note}
              onChange={event => {
                setEditedNote(event.target.value);
                lastEditorInputAtRef.current = Date.now();
                if (editorIdleRef.current) {
                  recordEditorActivity({
                    problemId,
                    phase: "active",
                    clientEventId: crypto.randomUUID(),
                  });
                  editorIdleRef.current = false;
                }
              }}
              onFocus={() => {
                editorFocusedRef.current = true;
                editorIdleRef.current = false;
                lastEditorInputAtRef.current = Date.now();
                recordEditorActivity({
                  problemId,
                  phase: "focused",
                  clientEventId: crypto.randomUUID(),
                });
              }}
              onBlur={() => {
                if (!editorFocusedRef.current) return;
                editorFocusedRef.current = false;
                editorIdleRef.current = false;
                recordEditorActivity({
                  problemId,
                  phase: "blurred",
                  clientEventId: crypto.randomUUID(),
                });
              }}
              placeholder="What have you tried? Which invariant or edge case is still unclear?"
            />
            <div className="mt-3 flex justify-end">
              <button
                onClick={() =>
                  saveNote.mutate({
                    noteId: notes.data?.[0]?.id,
                    problemId,
                    attemptId: attemptId ?? undefined,
                    content: note,
                    requestId: crypto.randomUUID(),
                  })
                }
                disabled={!note.trim() || saveNote.isPending}
                className="quiet-button"
              >
                Save private note
              </button>
            </div>
          </div>
          <div className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">PROGRESSIVE HINTS</p>
                <h3>Reveal only the next step</h3>
              </div>
              <Lightbulb className="h-4 w-4 text-amber-200" />
            </div>
            <p className="text-sm leading-6 text-slate-400">
              Hints are released in order on the server. A browser cannot skip
              directly to a later level.
            </p>
            {hint && (
              <div className="mt-4 rounded-xl border border-indigo-200/10 bg-indigo-400/[.08] p-4">
                <p className="text-[10px] uppercase tracking-[.16em] text-indigo-200">
                  Level {hint.level + 1}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  {hint.content}
                </p>
              </div>
            )}
            <button
              onClick={() =>
                attemptId ? nextHint.mutate({ attemptId }) : launch()
              }
              disabled={nextHint.isPending || start.isPending}
              className="primary-button mt-5"
            >
              {nextHint.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lightbulb className="h-4 w-4" />
              )}
              {attemptId
                ? "Reveal next approved hint"
                : "Start attempt to request a hint"}
            </button>
            {nextHint.error && (
              <p className="mt-3 text-xs leading-5 text-amber-100/70">
                {nextHint.error.message}
              </p>
            )}
          </div>
        </div>
        <aside className="space-y-6">
          <div className="panel">
            <p className="eyebrow">PERSONAL STATE</p>
            <p className="mt-3 text-xl font-medium capitalize text-slate-100">
              {progress?.status?.replaceAll("_", " ") ?? "Not started"}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              This status belongs to your workspace. External verdicts never
              silently overwrite it.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {(["planned", "in_progress", "review", "skipped"] as const).map(
                status => (
                  <button
                    key={status}
                    onClick={() => setStatus.mutate({ problemId, status })}
                    disabled={
                      setStatus.isPending || progress?.status === status
                    }
                    className="rounded-lg border border-white/[.08] bg-white/[.025] px-2.5 py-1.5 text-xs capitalize text-slate-400 transition hover:border-indigo-200/30 hover:text-indigo-100 disabled:opacity-40"
                  >
                    {status.replaceAll("_", " ")}
                  </button>
                )
              )}
            </div>
            {attemptId && (
              <div className="mt-5 grid gap-2">
                <button
                  onClick={() =>
                    setState.mutate({ attemptId, state: "paused" })
                  }
                  className="quiet-button"
                >
                  <CirclePause className="h-4 w-4" />
                  Pause attempt
                </button>
                <button
                  onClick={() =>
                    setState.mutate({
                      attemptId,
                      state: "completed",
                      outcome: "solved",
                    })
                  }
                  className="primary-button"
                >
                  <Check className="h-4 w-4" />
                  Mark solved
                </button>
              </div>
            )}
          </div>
          <div className="panel">
            <p className="eyebrow">SKILL SIGNALS</p>
            <div className="mt-4 space-y-3">
              {skills.length ? (
                skills.map(({ skill, link }) => (
                  <div
                    key={skill.id}
                    className="rounded-xl border border-white/[.06] bg-white/[.025] p-3"
                  >
                    <p className="text-sm text-slate-200">{skill.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {link.relevance} · {link.origin.replaceAll("_", " ")}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-slate-500">
                  No approved skill mapping is available yet.
                </p>
              )}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
