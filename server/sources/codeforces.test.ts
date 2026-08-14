import { describe, expect, it, vi } from "vitest";
import { CodeforcesAdapter } from "./codeforces";

function adapterWith(response: unknown) {
  return new CodeforcesAdapter(
    vi.fn().mockResolvedValue(response) as unknown as typeof fetch
  );
}

describe("Codeforces adapter", () => {
  it("normalizes an official problem snapshot into source-neutral metadata", async () => {
    const adapter = adapterWith({
      ok: true,
      json: async () => ({
        status: "OK",
        result: {
          problems: [
            {
              contestId: 4,
              index: "A",
              name: "Watermelon",
              rating: 800,
              tags: ["brute force"],
            },
          ],
        },
      }),
    });
    await expect(adapter.fetchProblemSnapshot()).resolves.toMatchObject({
      status: "success",
      data: [
        {
          externalKey: "4-A",
          title: "Watermelon",
          difficulty: 800,
          tags: ["brute force"],
        },
      ],
    });
  });

  it("normalizes public submissions without importing source code", async () => {
    const adapter = adapterWith({
      ok: true,
      json: async () => ({
        status: "OK",
        result: [
          {
            id: 7,
            verdict: "OK",
            programmingLanguage: "GNU C++17",
            creationTimeSeconds: 100,
            problem: { contestId: 4, index: "A" },
          },
        ],
      }),
    });
    await expect(
      adapter.fetchSubmissionsPage({ handle: "tourist", from: 1, count: 10 })
    ).resolves.toMatchObject({
      status: "success",
      data: {
        isExhausted: true,
        items: [
          {
            externalSubmissionId: "7",
            externalProblemKey: "4-A",
            verdict: "OK",
            language: "GNU C++17",
          },
        ],
      },
    });
  });

  it("returns a retryable source outcome for provider failures", async () => {
    const adapter = adapterWith({ ok: false });
    await expect(adapter.fetchProblemSnapshot()).resolves.toMatchObject({
      status: "retryable_failure",
    });
  });

  it("distinguishes an invalid handle from a rate limit", async () => {
    const invalidHandle = adapterWith({
      ok: true,
      json: async () => ({
        status: "FAILED",
        comment: "handles: User with handle missing not found",
      }),
    });
    await expect(
      invalidHandle.fetchSubmissionsPage({
        handle: "missing",
        from: 1,
        count: 10,
      })
    ).resolves.toMatchObject({ status: "permanent_failure" });

    const rateLimited = adapterWith({
      ok: true,
      json: async () => ({ status: "FAILED", comment: "Call limit exceeded" }),
    });
    await expect(rateLimited.fetchProblemSnapshot()).resolves.toMatchObject({
      status: "retryable_failure",
    });
  });
});
