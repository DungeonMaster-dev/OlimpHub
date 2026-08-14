import { useState } from "react";
import { ExternalLink, FileCheck2, Filter, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Empty, ErrorState } from "./Home";

function verdictTone(verdict: string) {
  if (verdict === "OK")
    return "border-emerald-300/20 bg-emerald-300/10 text-emerald-200";
  if (
    verdict.includes("WRONG") ||
    verdict.includes("TIME") ||
    verdict.includes("MEMORY")
  )
    return "border-rose-300/20 bg-rose-300/10 text-rose-200";
  return "border-amber-300/20 bg-amber-300/10 text-amber-100";
}

export default function Submissions() {
  const [verdict, setVerdict] = useState("all");
  const input = {
    verdict: verdict === "all" ? undefined : verdict,
    page: 0,
    pageSize: 25,
  };
  const history = trpc.olimp.submissions.list.useQuery(input);
  const utils = trpc.useUtils();
  const sync = trpc.olimp.codeforces.syncSubmissions.useMutation({
    onSuccess: () => utils.olimp.submissions.list.invalidate(),
  });

  if (history.error) return <ErrorState message={history.error.message} />;

  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">CODEFORCES TRACE</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em]">
            Review verdicts without losing context.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Only public submissions from your linked handle are stored here.
            Each row stays linked to the canonical problem when metadata is
            available.
          </p>
        </div>
        <button
          onClick={() => sync.mutate()}
          disabled={sync.isPending}
          className="quiet-button"
        >
          {sync.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileCheck2 className="h-4 w-4" />
          )}{" "}
          Sync public verdicts
        </button>
      </section>
      <section className="panel p-4">
        <label className="field-shell max-w-xs">
          <Filter className="h-4 w-4" />
          <select
            value={verdict}
            onChange={event => setVerdict(event.target.value)}
          >
            <option value="all">All verdicts</option>
            {history.data?.verdicts.map(item => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </section>
      {history.isLoading ? (
        <div className="panel h-72 animate-pulse" />
      ) : history.data?.items.length ? (
        <section className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-white/[.06] text-xs uppercase tracking-[.14em] text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-medium">Problem</th>
                  <th className="px-5 py-4 font-medium">Verdict</th>
                  <th className="px-5 py-4 font-medium">Language</th>
                  <th className="px-5 py-4 font-medium">Submitted</th>
                  <th className="px-5 py-4" />
                </tr>
              </thead>
              <tbody>
                {history.data.items.map(({ submission, problem }) => (
                  <tr
                    key={submission.id}
                    className="border-b border-white/[.045] last:border-0"
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-200">
                        {problem?.title ?? submission.externalProblemKey}
                      </p>
                      <p className="mt-1 font-mono text-xs text-slate-500">
                        {submission.externalProblemKey}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${verdictTone(submission.verdict)}`}
                      >
                        {submission.verdict}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {submission.language ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {new Date(submission.submittedAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      {problem?.sourceUrl && (
                        <a
                          href={problem.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-200 hover:text-white"
                          aria-label="Open problem source"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className="panel">
          <Empty
            icon={FileCheck2}
            text={
              sync.isSuccess
                ? "No submissions match this verdict filter."
                : "Link a Codeforces handle in Settings, then sync your public verdicts to build this private trace."
            }
          />
        </div>
      )}
    </div>
  );
}
