import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  insertedRatingRows: null as Array<Record<string, unknown>> | null,
  persistedRatingFacts: new Map<string, Record<string, unknown>>(),
  limitedResults: [] as unknown[][],
  ratingHistory: vi.fn(),
}));

vi.mock("./db", () => ({ getDb: mocks.getDb }));
vi.mock("./sources/codeforces", () => ({
  codeforcesAdapter: {
    fetchRatingHistory: mocks.ratingHistory,
    sourceId: "codeforces",
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

describe("Codeforces rating history import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.insertedRatingRows = null;
    mocks.persistedRatingFacts.clear();
    mocks.limitedResults = [
      [],
      [
        {
          id: 7,
          userId: 1,
          handle: "tourist",
          syncConsent: "enabled",
        },
      ],
      [],
      [
        {
          id: 7,
          userId: 1,
          handle: "tourist",
          syncConsent: "enabled",
        },
      ],
    ];
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(async () => mocks.limitedResults.shift() ?? []),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        values: vi.fn((values: Array<Record<string, unknown>>) => {
          if (Array.isArray(values)) {
            mocks.insertedRatingRows = values;
          }
          return {
            onDuplicateKeyUpdate: vi.fn(async () => {
              if (!Array.isArray(values)) return;
              values.forEach(row => {
                const key = `${row.userId}:${row.contestId}:${(row.ratedAt as Date).toISOString()}`;
                mocks.persistedRatingFacts.set(key, row);
              });
            }),
          };
        }),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({ where: vi.fn(async () => undefined) })),
      })),
    };
    mocks.getDb.mockResolvedValue(db);
  });

  it("persists normalized contest-rating facts with unique source identity fields", async () => {
    mocks.ratingHistory.mockResolvedValue({
      status: "success",
      observedAt: new Date(),
      data: [
        {
          externalContestId: "1",
          contestName: "Codeforces Beta Round",
          rank: 42,
          oldRating: 1200,
          newRating: 1337,
          ratedAt: new Date(100_000),
        },
      ],
    });

    await expect(
      appRouter.createCaller(userContext()).olimp.codeforces.syncRatingHistory()
    ).resolves.toMatchObject({ importedCount: 1, handle: "tourist" });
    expect(mocks.insertedRatingRows).toEqual([
      expect.objectContaining({
        userId: 1,
        codeforcesLinkId: 7,
        contestId: 1,
        contestName: "Codeforces Beta Round",
        oldRating: 1200,
        newRating: 1337,
      }),
    ]);
  });

  it("does not write rating facts when Codeforces temporarily fails", async () => {
    mocks.ratingHistory.mockResolvedValue({
      status: "retryable_failure",
      observedAt: new Date(),
      message: "temporary provider outage",
    });

    await expect(
      appRouter.createCaller(userContext()).olimp.codeforces.syncRatingHistory()
    ).rejects.toMatchObject({ code: "BAD_GATEWAY" });
    expect(mocks.insertedRatingRows).toBeNull();
  });

  it("upserts the same public contest-rating fact across repeated synchronizations", async () => {
    mocks.ratingHistory.mockResolvedValue({
      status: "success",
      observedAt: new Date(),
      data: [
        {
          externalContestId: "1",
          contestName: "Codeforces Beta Round",
          rank: 42,
          oldRating: 1200,
          newRating: 1337,
          ratedAt: new Date(100_000),
        },
      ],
    });
    const caller = appRouter.createCaller(userContext());

    await caller.olimp.codeforces.syncRatingHistory();
    await caller.olimp.codeforces.syncRatingHistory();

    expect(mocks.persistedRatingFacts).toHaveLength(1);
    expect(Array.from(mocks.persistedRatingFacts.values())).toEqual([
      expect.objectContaining({ userId: 1, contestId: 1, newRating: 1337 }),
    ]);
  });
});
