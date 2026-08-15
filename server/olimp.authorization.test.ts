import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function anonymousContext(): TrpcContext {
  return {
    user: null,
    req: { headers: {}, protocol: "https" } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("OlimpHub protected workspace", () => {
  it("rejects an anonymous dashboard request before reading private data", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.olimp.dashboard()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("rejects anonymous Codeforces metadata synchronization", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.olimp.codeforces.syncCatalogue()).rejects.toMatchObject(
      { code: "UNAUTHORIZED" }
    );
  });

  it("rejects an anonymous submission-history request", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(
      caller.olimp.submissions.list({ page: 0, pageSize: 25 })
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("rejects anonymous manual-training reads before exposing private sessions", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.olimp.training.list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("rejects anonymous virtual-contest reads before exposing private sessions", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.olimp.contests.list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("rejects an anonymous rating and progress timeline request", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(
      caller.olimp.analytics.timeline({ periodDays: 30 })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects anonymous activity statistics before reading private events", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(
      caller.olimp.analytics.activityStatistics()
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects anonymous activity streak reads before querying private dates", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.olimp.analytics.activityStreak()).rejects.toMatchObject(
      {
        code: "UNAUTHORIZED",
      }
    );
  });

  it("rejects anonymous skill-mastery reads before querying private solved evidence", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.olimp.skills.mastery()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("rejects anonymous canonicalization changes before reading catalogue data", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(
      caller.olimp.canonicalization.proposeRelation({
        firstProblemId: 1,
        secondProblemId: 2,
        relationType: "same_problem",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects anonymous source-health monitoring before reading sync state", async () => {
    const caller = appRouter.createCaller(anonymousContext());
    await expect(caller.olimp.sourceHealth.list()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
