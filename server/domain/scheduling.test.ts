import { describe, expect, it } from "vitest";
import {
  codeforcesProfileSyncJobName,
  dailyCodeforcesProfileSyncCron,
} from "./scheduling";

describe("daily Codeforces profile scheduling", () => {
  it("uses a deterministic per-link job name and a six-field daily UTC cron", () => {
    expect(codeforcesProfileSyncJobName(42)).toBe(
      "codeforces-daily-profile-42"
    );
    expect(dailyCodeforcesProfileSyncCron).toBe("0 0 3 * * *");
  });
});
