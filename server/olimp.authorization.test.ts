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
});
