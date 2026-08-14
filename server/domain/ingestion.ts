import { createHash } from "node:crypto";
import type {
  SourceProblem,
  SourceResult,
  SourceSubmission,
  SourceSubmissionPage,
} from "../sources/types";

export function catalogueSnapshotFingerprint(problems: SourceProblem[]) {
  const canonical = problems
    .map(problem => ({
      key: problem.externalKey,
      title: problem.title,
      difficulty: problem.difficulty,
      tags: [...problem.tags].sort(),
    }))
    .sort((left, right) => left.key.localeCompare(right.key));
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

export function nextSubmissionCursor(
  cursor: string | null | undefined,
  submissions: SourceSubmission[]
) {
  const previous = Number.parseInt(cursor ?? "0", 10);
  const highest = submissions.reduce(
    (maximum, submission) =>
      Math.max(
        maximum,
        Number.parseInt(submission.externalSubmissionId, 10) || 0
      ),
    Number.isFinite(previous) ? previous : 0
  );
  return String(highest);
}

export function isNewerThanCursor(
  submission: SourceSubmission,
  cursor: string | null | undefined
) {
  const previous = Number.parseInt(cursor ?? "0", 10);
  return (
    Number.parseInt(submission.externalSubmissionId, 10) >
    (Number.isFinite(previous) ? previous : 0)
  );
}

export async function collectNewSubmissionPages(input: {
  cursor: string | null | undefined;
  pageSize: number;
  fetchPage: (
    from: number,
    count: number
  ) => Promise<SourceResult<SourceSubmissionPage>>;
}): Promise<SourceResult<{ items: SourceSubmission[]; scannedPages: number }>> {
  const previous = Number.parseInt(input.cursor ?? "0", 10) || 0;
  const items: SourceSubmission[] = [];
  let from = 1;
  let scannedPages = 0;
  while (true) {
    const page = await input.fetchPage(from, input.pageSize);
    scannedPages += 1;
    if (page.status !== "success") return page;
    const reachedCursor = page.data.items.some(
      item => Number.parseInt(item.externalSubmissionId, 10) <= previous
    );
    items.push(
      ...page.data.items.filter(
        item => Number.parseInt(item.externalSubmissionId, 10) > previous
      )
    );
    if (page.data.isExhausted || reachedCursor)
      return {
        status: "success",
        observedAt: page.observedAt,
        data: { items, scannedPages },
      };
    from += input.pageSize;
  }
}
