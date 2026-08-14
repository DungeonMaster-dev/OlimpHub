import { TRPCError } from "@trpc/server";
import type {
  ProblemSourceAdapter,
  SourceProblem,
  SourceResult,
  SourceSubmissionPage,
} from "./types";
import {
  SourceRequestCoordinator,
  stableRequestCacheKey,
} from "./requestCoordinator";

const codeforcesRequestCoordinator = new SourceRequestCoordinator({
  minIntervalMs: 2200,
});
const catalogueCacheTtlMs = 5 * 60 * 1000;

export type CodeforcesProblem = {
  contestId?: number;
  index?: string;
  name?: string;
  rating?: number;
  tags?: string[];
};
export type CodeforcesSubmission = {
  id?: number;
  verdict?: string;
  programmingLanguage?: string;
  creationTimeSeconds?: number;
  problem?: CodeforcesProblem;
};

function codeforcesKey(
  contestId: number | undefined,
  index: string | undefined
) {
  return contestId && index ? `${contestId}-${index}` : null;
}

function classifyFailure(
  error: unknown,
  observedAt: Date
): Exclude<SourceResult<never>, { status: "success" }> {
  const message =
    error instanceof Error
      ? error.message
      : "Codeforces is temporarily unavailable.";
  const retryable =
    /call limit|temporar|timeout|abort|network|unavailable|gateway/i.test(
      message
    );
  return {
    status: retryable ? "retryable_failure" : "permanent_failure",
    observedAt,
    message,
  };
}

export class CodeforcesAdapter implements ProblemSourceAdapter {
  readonly sourceId = "codeforces";
  constructor(
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly requestCoordinator = codeforcesRequestCoordinator
  ) {}

  async request<T>(
    method: string,
    params: Record<string, string> = {},
    cacheTtlMs = 0
  ) {
    return this.requestCoordinator.run(
      { cacheKey: stableRequestCacheKey(method, params), cacheTtlMs },
      () => this.fetchJson<T>(method, params)
    );
  }

  private async fetchJson<T>(method: string, params: Record<string, string>) {
    const url = new URL(`https://codeforces.com/api/${method}`);
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.set(key, value)
    );
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    try {
      const response = await this.fetchImpl(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      if (!response.ok)
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: "Codeforces is temporarily unavailable.",
        });
      const payload = (await response.json()) as {
        status?: string;
        result?: T;
        comment?: string;
      };
      if (payload.status !== "OK" || payload.result === undefined)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: payload.comment ?? "Codeforces rejected the request.",
        });
      return payload.result;
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "BAD_GATEWAY",
        message: "Codeforces is temporarily unavailable.",
        cause: error,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  async fetchProblemSnapshot(): Promise<SourceResult<SourceProblem[]>> {
    const observedAt = new Date();
    try {
      const result = await this.request<{ problems: CodeforcesProblem[] }>(
        "problemset.problems",
        {},
        catalogueCacheTtlMs
      );
      return {
        status: "success",
        observedAt,
        data: result.problems.flatMap(problem => {
          const externalKey = codeforcesKey(problem.contestId, problem.index);
          return externalKey &&
            problem.name &&
            problem.contestId &&
            problem.index
            ? [
                {
                  externalKey,
                  title: problem.name,
                  sourceUrl: `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`,
                  difficulty: problem.rating ?? null,
                  tags: problem.tags ?? [],
                },
              ]
            : [];
        }),
      };
    } catch (error) {
      return classifyFailure(error, observedAt);
    }
  }

  async fetchSubmissionsPage(input: {
    handle: string;
    from: number;
    count: number;
  }): Promise<SourceResult<SourceSubmissionPage>> {
    const observedAt = new Date();
    try {
      const submissions = await this.request<CodeforcesSubmission[]>(
        "user.status",
        {
          handle: input.handle,
          from: String(input.from),
          count: String(input.count),
        }
      );
      const items = submissions.flatMap(submission => {
        const externalProblemKey = codeforcesKey(
          submission.problem?.contestId,
          submission.problem?.index
        );
        return submission.id &&
          externalProblemKey &&
          submission.creationTimeSeconds
          ? [
              {
                externalSubmissionId: String(submission.id),
                externalProblemKey,
                verdict: submission.verdict ?? "UNKNOWN",
                language: submission.programmingLanguage ?? null,
                submittedAt: new Date(submission.creationTimeSeconds * 1000),
              },
            ]
          : [];
      });
      return {
        status: "success",
        observedAt,
        data: { items, isExhausted: submissions.length < input.count },
      };
    } catch (error) {
      return classifyFailure(error, observedAt);
    }
  }
}

export const codeforcesAdapter = new CodeforcesAdapter();
