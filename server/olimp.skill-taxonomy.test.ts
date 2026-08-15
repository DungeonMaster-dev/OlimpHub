import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));

vi.mock("./db", () => ({ getDb: mocks.getDb }));

import { appRouter } from "./routers";

function userContext(): TrpcContext {
  return {
    user: { id: 1, openId: "user-1", role: "user", name: null },
    req: { headers: {}, protocol: "https" } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("skills.map taxonomy version", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns only approved records and relationships from the published taxonomy version", async () => {
    const graphVersion = {
      id: 4,
      semanticVersion: "1.0.0",
      changeSummary: "Initial approved algorithm taxonomy.",
      publishedAt: new Date("2026-08-15T00:00:00.000Z"),
    };
    const nodes = [
      {
        id: 10,
        graphVersionId: 4,
        stableKey: "foundations.complexity",
        title: "Complexity analysis",
      },
      {
        id: 11,
        graphVersionId: 4,
        stableKey: "algorithms.graphs.traversal",
        title: "Graph traversal",
      },
    ];
    const edges = [
      { id: 1, fromSkillId: 10, toSkillId: 11, relationType: "refines" },
      { id: 2, fromSkillId: 10, toSkillId: 99, relationType: "refines" },
    ];
    const links = [
      { link: { id: 1, skillId: 11 }, problem: { id: 1, title: "BFS" } },
      {
        link: { id: 2, skillId: 99 },
        problem: { id: 2, title: "Legacy mapping" },
      },
    ];
    const select = vi
      .fn()
      .mockReturnValueOnce({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn(async () => [graphVersion]),
            })),
          })),
        })),
      })
      .mockReturnValueOnce({
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(async () => nodes.map(node => ({ node }))),
            })),
          })),
        })),
      })
      .mockReturnValueOnce({ from: vi.fn(async () => edges) })
      .mockReturnValueOnce({
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({ innerJoin: vi.fn(async () => links) })),
        })),
      });
    mocks.getDb.mockResolvedValue({ select });

    const result = await appRouter
      .createCaller(userContext())
      .olimp.skills.map();

    expect(result.graphVersion).toMatchObject({
      semanticVersion: "1.0.0",
      changeSummary: "Initial approved algorithm taxonomy.",
    });
    expect(result.nodes).toEqual(nodes);
    expect(result.edges).toEqual([edges[0]]);
    expect(result.links).toEqual([links[0]]);
  });
});
