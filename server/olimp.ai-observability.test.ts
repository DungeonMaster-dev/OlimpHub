import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  rows: [] as unknown[],
}));

vi.mock("./db", () => ({ getDb: mocks.getDb }));

import { appRouter } from "./routers";

function userContext(): TrpcContext {
  return {
    user: { id: 31, openId: "user-31", role: "user", name: null },
    req: { headers: {}, protocol: "https" } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("protected AI observability", () => {
  beforeEach(() => {
    mocks.rows = [];
    mocks.getDb.mockResolvedValue({
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({ limit: vi.fn(async () => mocks.rows) })),
          })),
        })),
      })),
    });
  });

  it("returns only owner-scoped operational metadata and nullable unavailable cost", async () => {
    mocks.rows = [
      {
        operation: "contest_draft",
        model: "claude-haiku-4-5",
        outcome: "failed",
        latencyMs: 182,
        costMicrounits: null,
        errorCode: "invalid_json",
        occurredAt: new Date("2026-08-15T10:00:00.000Z"),
      },
    ];

    const result = await appRouter
      .createCaller(userContext())
      .olimp.ai.observability();

    expect(result).toEqual(mocks.rows);
    expect(result[0]).not.toHaveProperty("prompt");
    expect(result[0]).not.toHaveProperty("response");
    expect(result[0]?.costMicrounits).toBeNull();
  });
});
