import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  claimedLink: [] as Array<{ userId: number }>,
  getDb: vi.fn(),
  persisted: null as Record<string, unknown> | null,
  profile: vi.fn(),
}));

vi.mock("./db", () => ({ getDb: mocks.getDb }));
vi.mock("./sources/codeforces", () => ({
  codeforcesAdapter: {
    fetchPublicProfile: mocks.profile,
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

describe("Codeforces handle linking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.claimedLink = [];
    mocks.persisted = null;
    mocks.getDb.mockResolvedValue({
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(async () => mocks.claimedLink),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        values: vi.fn((values: Record<string, unknown>) => {
          mocks.persisted = values;
          return { onDuplicateKeyUpdate: vi.fn(async () => undefined) };
        }),
      })),
    });
  });

  it("persists only the profile-confirmed canonical public handle", async () => {
    mocks.profile.mockResolvedValue({
      status: "success",
      observedAt: new Date(),
      data: { displayName: "ToUrIsT", externalUserKey: "tourist" },
    });

    const response = await appRouter
      .createCaller(userContext())
      .olimp.settings.setCodeforcesHandle({ handle: "tourist" });

    expect(response).toEqual({
      success: true,
      handle: "ToUrIsT",
      verificationStatus: "declared_public",
    });
    expect(mocks.persisted).toMatchObject({
      userId: 1,
      handle: "ToUrIsT",
      normalizedHandle: "tourist",
    });
  });

  it("rejects an invalid public profile without writing a link", async () => {
    mocks.profile.mockResolvedValue({
      status: "permanent_failure",
      observedAt: new Date(),
      message: "handle not found",
    });

    await expect(
      appRouter
        .createCaller(userContext())
        .olimp.settings.setCodeforcesHandle({ handle: "missing" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mocks.persisted).toBeNull();
  });

  it("prevents a confirmed public handle from being linked to another workspace", async () => {
    mocks.profile.mockResolvedValue({
      status: "success",
      observedAt: new Date(),
      data: { displayName: "tourist", externalUserKey: "tourist" },
    });
    mocks.claimedLink = [{ userId: 2 }];

    await expect(
      appRouter
        .createCaller(userContext())
        .olimp.settings.setCodeforcesHandle({ handle: "tourist" })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(mocks.persisted).toBeNull();
  });

  it("surfaces a retryable provider failure without writing a link", async () => {
    mocks.profile.mockResolvedValue({
      status: "retryable_failure",
      observedAt: new Date(),
      message: "temporary provider outage",
    });

    await expect(
      appRouter
        .createCaller(userContext())
        .olimp.settings.setCodeforcesHandle({ handle: "tourist" })
    ).rejects.toMatchObject({ code: "BAD_GATEWAY" });
    expect(mocks.persisted).toBeNull();
  });
});
