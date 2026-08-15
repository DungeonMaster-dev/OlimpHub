import { describe, expect, it } from "vitest";
import { classifySourceSyncFailure } from "./syncOutcome";

describe("source synchronization outcome", () => {
  it("records provider and local cooldowns as rate-limited rather than generic failure", () => {
    expect(
      classifySourceSyncFailure(new Error("Call limit exceeded"))
    ).toMatchObject({ status: "rate_limited" });
    expect(
      classifySourceSyncFailure(
        new Error(
          "Please wait one minute before repeating this Codeforces sync."
        )
      )
    ).toMatchObject({ status: "rate_limited" });
  });

  it("keeps unrelated provider outages as failures", () => {
    expect(
      classifySourceSyncFailure(
        new Error("Codeforces is temporarily unavailable.")
      )
    ).toMatchObject({ status: "failed" });
  });
});
