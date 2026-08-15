import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), rows: [] as unknown[] }));

vi.mock("./db", () => ({ getDb: mocks.getDb }));

import { appRouter } from "./routers";

function userContext(): TrpcContext {
  return {
    user: { id: 71, openId: "user-71", role: "user", name: null },
    req: { headers: {}, protocol: "https" } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("protected recurring attempt evidence", () => {
  beforeEach(() => {
    mocks.rows = [];
    mocks.getDb.mockResolvedValue({
      select: vi.fn(() => ({
        from: vi.fn(() => ({ where: vi.fn(async () => mocks.rows) })),
      })),
    });
  });

  it("returns owner-scoped repeated attempt facts from allowlisted columns only", async () => {
    mocks.rows = [
      { state: "completed", outcome: "not_solved", highestHintLevel: 2 },
      { state: "abandoned", outcome: "unknown", highestHintLevel: 3 },
      { state: "completed", outcome: "not_solved", highestHintLevel: 2 },
    ];

    await expect(
      appRouter.createCaller(userContext()).olimp.ai.recurringPatterns()
    ).resolves.toMatchObject({
      calculationVersion: "recurring-patterns-v1",
      status: "patterns_detected",
      analyzedAttemptCount: 3,
      recurringPatterns: expect.arrayContaining([
        expect.objectContaining({
          code: "repeated_unresolved_outcomes",
          count: 2,
        }),
      ]),
    });
  });

  it("returns an insufficient-evidence state for fewer than two attempts", async () => {
    mocks.rows = [
      { state: "completed", outcome: "not_solved", highestHintLevel: 2 },
    ];

    await expect(
      appRouter.createCaller(userContext()).olimp.ai.recurringPatterns()
    ).resolves.toMatchObject({
      status: "insufficient_evidence",
      recurringPatterns: [],
    });
  });
});
