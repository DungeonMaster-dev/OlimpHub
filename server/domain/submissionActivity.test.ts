import { describe, expect, it } from "vitest";
import { summarizeSubmissionVerdicts } from "./submissionActivity";

describe("submission verdict activity", () => {
  it("produces a stable compact verdict summary without submission content", () => {
    expect(
      summarizeSubmissionVerdicts([
        { verdict: "WRONG_ANSWER" },
        { verdict: "OK" },
        { verdict: "WRONG_ANSWER" },
      ])
    ).toEqual({ OK: 1, WRONG_ANSWER: 2 });
  });
});
