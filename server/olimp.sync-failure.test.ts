import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  page: vi.fn(),
  limitedResults: [] as unknown[][],
  inserts: [] as Array<Record<string, unknown>>,
  updates: [] as Array<Record<string, unknown>>,
}));

vi.mock("./db", () => ({ getDb: mocks.getDb }));
vi.mock("./sources/codeforces", () => ({
  codeforcesAdapter: {
    sourceId: "codeforces",
    fetchSubmissionsPage: mocks.page,
  },
}));

import { appRouter } from "./routers";

function userContext(): TrpcContext {
  return {
    user: { id: 1, openId: "user-1", role: "user", name: null },
    req: { headers: {}, protocol: "https" } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Codeforces sync failure state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.inserts = [];
    mocks.updates = [];
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => {
            const result = mocks.limitedResults.shift() ?? [];
            return {
              limit: vi.fn(async () => result),
              then: (
                resolve: (value: unknown[]) => unknown,
                reject?: (reason: unknown) => unknown
              ) => Promise.resolve(result).then(resolve, reject),
            };
          }),
        })),
      })),
      insert: vi.fn(() => ({
        values: vi.fn((values: Record<string, unknown>) => {
          mocks.inserts.push(values);
          return { onDuplicateKeyUpdate: vi.fn(async () => undefined) };
        }),
      })),
      update: vi.fn(() => ({
        set: vi.fn((values: Record<string, unknown>) => {
          mocks.updates.push(values);
          return { where: vi.fn(async () => undefined) };
        }),
      })),
    };
    mocks.getDb.mockResolvedValue(db);
  });

  it("records failed state without advancing an existing submission cursor", async () => {
    mocks.limitedResults = [
      [
        {
          cursor: "100",
          lastStartedAt: new Date("2026-08-01T00:00:00.000Z"),
        },
      ],
      [{ id: 7, handle: "tourist", syncConsent: "enabled" }],
    ];
    mocks.page.mockResolvedValue({
      status: "retryable_failure",
      observedAt: new Date(),
      message: "Codeforces is temporarily unavailable.",
    });

    await expect(
      appRouter.createCaller(userContext()).olimp.codeforces.syncSubmissions()
    ).rejects.toMatchObject({
      code: "BAD_GATEWAY",
      message: "Codeforces is temporarily unavailable.",
    });

    expect(mocks.updates).toContainEqual(
      expect.objectContaining({ status: "failed" })
    );
    expect(mocks.updates.at(-1)).not.toHaveProperty("cursor");
  });

  it("records local cooldown as rate_limited without touching the existing cursor", async () => {
    mocks.limitedResults = [
      [
        {
          cursor: "100",
          lastStartedAt: new Date(),
        },
      ],
    ];

    await expect(
      appRouter.createCaller(userContext()).olimp.codeforces.syncSubmissions()
    ).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
      message: "Please wait one minute before repeating this Codeforces sync.",
    });

    expect(mocks.inserts).toContainEqual(
      expect.objectContaining({ status: "rate_limited" })
    );
    expect(mocks.inserts.at(-1)).not.toHaveProperty("cursor");
    expect(mocks.page).not.toHaveBeenCalled();
  });

  it("records a compact verdict summary after a successful public submission sync", async () => {
    mocks.limitedResults = [
      [
        {
          cursor: null,
          lastStartedAt: new Date("2026-08-01T00:00:00.000Z"),
        },
      ],
      [{ id: 7, handle: "tourist", syncConsent: "enabled" }],
      [{ id: 9, externalKey: "1-A" }],
    ];
    mocks.page.mockResolvedValue({
      status: "success",
      observedAt: new Date(),
      data: {
        items: [
          {
            externalSubmissionId: "101",
            externalProblemKey: "1-A",
            verdict: "OK",
            language: "GNU C++17",
            submittedAt: new Date("2026-08-01T00:00:00.000Z"),
          },
          {
            externalSubmissionId: "102",
            externalProblemKey: "1-A",
            verdict: "WRONG_ANSWER",
            language: "GNU C++17",
            submittedAt: new Date("2026-08-01T00:01:00.000Z"),
          },
        ],
        isExhausted: true,
      },
    });

    await expect(
      appRouter.createCaller(userContext()).olimp.codeforces.syncSubmissions()
    ).resolves.toMatchObject({
      importedCount: 2,
      verdictCounts: { OK: 1, WRONG_ANSWER: 1 },
    });
    expect(mocks.inserts).toContainEqual(
      expect.objectContaining({
        eventType: "codeforces_submissions_synced",
        metadata: {
          importedCount: 2,
          verdictCounts: { OK: 1, WRONG_ANSWER: 1 },
        },
      })
    );
  });
});
