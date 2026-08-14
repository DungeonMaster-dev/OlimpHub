import { describe, expect, it, vi } from "vitest";
import { collectNewSubmissionPages } from "../domain/ingestion";
import { CodeforcesAdapter } from "./codeforces";
import { SourceRequestCoordinator } from "./requestCoordinator";

function codeforcesSubmission(id: number, index: string) {
  return {
    id,
    verdict: "OK",
    programmingLanguage: "GNU C++17",
    creationTimeSeconds: id,
    problem: { contestId: 4, index },
    source: "int main() { return 0; }",
  };
}

describe("Codeforces ingestion boundary", () => {
  it("collects multiple adapter pages up to the durable cursor without exposing submitted source code", async () => {
    const offsets: string[] = [];
    const fetchImpl = vi.fn(async (input: URL) => {
      const from = input.searchParams.get("from")!;
      offsets.push(from);
      const result =
        from === "1"
          ? [codeforcesSubmission(2002, "A"), codeforcesSubmission(2001, "B")]
          : [codeforcesSubmission(1000, "C"), codeforcesSubmission(999, "D")];
      return {
        ok: true,
        json: async () => ({ status: "OK", result }),
      };
    }) as unknown as typeof fetch;
    const adapter = new CodeforcesAdapter(
      fetchImpl,
      new SourceRequestCoordinator({ minIntervalMs: 0 })
    );

    const collected = await collectNewSubmissionPages({
      cursor: "1000",
      pageSize: 2,
      fetchPage: (from, count) =>
        adapter.fetchSubmissionsPage({ handle: "tourist", from, count }),
    });

    expect(collected).toMatchObject({
      status: "success",
      data: { scannedPages: 2 },
    });
    if (collected.status === "success") {
      expect(
        collected.data.items.map(item => item.externalSubmissionId)
      ).toEqual(["2002", "2001"]);
      expect(collected.data.items[0]).not.toHaveProperty("source");
    }
    expect(offsets).toEqual(["1", "3"]);
  });

  it("preserves a retryable provider failure rather than treating it as an empty page", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue({ ok: false }) as unknown as typeof fetch;
    const adapter = new CodeforcesAdapter(
      fetchImpl,
      new SourceRequestCoordinator({ minIntervalMs: 0 })
    );

    await expect(
      collectNewSubmissionPages({
        cursor: null,
        pageSize: 2,
        fetchPage: (from, count) =>
          adapter.fetchSubmissionsPage({ handle: "tourist", from, count }),
      })
    ).resolves.toMatchObject({ status: "retryable_failure" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("coalesces concurrent identical ingestion and spaces the next cursor page", async () => {
    let now = 0;
    const requestTimes: number[] = [];
    const fetchImpl = vi.fn(async (input: URL) => {
      requestTimes.push(now);
      const from = input.searchParams.get("from");
      const result =
        from === "1"
          ? [codeforcesSubmission(2002, "A"), codeforcesSubmission(2001, "B")]
          : [codeforcesSubmission(1000, "C")];
      return { ok: true, json: async () => ({ status: "OK", result }) };
    }) as unknown as typeof fetch;
    const adapter = new CodeforcesAdapter(
      fetchImpl,
      new SourceRequestCoordinator({
        minIntervalMs: 2200,
        now: () => now,
        sleep: async milliseconds => {
          now += milliseconds;
        },
      })
    );
    const collect = () =>
      collectNewSubmissionPages({
        cursor: "1000",
        pageSize: 2,
        fetchPage: (from, count) =>
          adapter.fetchSubmissionsPage({ handle: "tourist", from, count }),
      });

    const [first, duplicate] = await Promise.all([collect(), collect()]);
    expect(first).toMatchObject({ status: "success" });
    expect(duplicate).toMatchObject({ status: "success" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(requestTimes).toEqual([0, 2200]);
  });

  it("retries a later ingestion after a provider failure instead of caching the failure", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "OK",
          result: [codeforcesSubmission(2002, "A")],
        }),
      }) as unknown as typeof fetch;
    const adapter = new CodeforcesAdapter(
      fetchImpl,
      new SourceRequestCoordinator({ minIntervalMs: 0 })
    );
    const collect = () =>
      collectNewSubmissionPages({
        cursor: null,
        pageSize: 2,
        fetchPage: (from, count) =>
          adapter.fetchSubmissionsPage({ handle: "tourist", from, count }),
      });

    await expect(collect()).resolves.toMatchObject({
      status: "retryable_failure",
    });
    await expect(collect()).resolves.toMatchObject({ status: "success" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
