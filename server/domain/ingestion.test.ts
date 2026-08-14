import { describe, expect, it } from "vitest";
import {
  canonicalProblemIdForExternalKey,
  catalogueSnapshotFingerprint,
  collectNewSubmissionPages,
  isNewerThanCursor,
  nextSubmissionCursor,
} from "./ingestion";

describe("incremental ingestion rules", () => {
  it("uses a stable fingerprint independent of provider ordering", () => {
    const first = [
      {
        externalKey: "4-A",
        title: "Watermelon",
        sourceUrl: "https://example.test/4/A",
        difficulty: 800,
        tags: ["brute force", "math"],
      },
      {
        externalKey: "1-A",
        title: "Theatre",
        sourceUrl: "https://example.test/1/A",
        difficulty: 1000,
        tags: ["math"],
      },
    ];
    const second = [
      { ...first[1]!, tags: ["math"] },
      { ...first[0]!, tags: ["math", "brute force"] },
    ];
    expect(catalogueSnapshotFingerprint(first)).toBe(
      catalogueSnapshotFingerprint(second)
    );
  });

  it("moves a submission cursor only forward across overlapping pages", () => {
    const first = {
      externalSubmissionId: "101",
      externalProblemKey: "4-A",
      verdict: "OK",
      language: "GNU C++",
      submittedAt: new Date(),
    };
    const overlap = { ...first, externalSubmissionId: "100" };
    expect(nextSubmissionCursor("99", [first, overlap])).toBe("101");
    expect(nextSubmissionCursor("101", [overlap])).toBe("101");
    expect(isNewerThanCursor(first, "99")).toBe(true);
    expect(isNewerThanCursor(overlap, "101")).toBe(false);
  });

  it("walks past more than one provider page before advancing the cursor", async () => {
    const submission = (id: number) => ({
      externalSubmissionId: String(id),
      externalProblemKey: "4-A",
      verdict: "OK",
      language: null,
      submittedAt: new Date(),
    });
    const pages = [
      {
        items: Array.from({ length: 1000 }, (_, index) =>
          submission(3000 - index)
        ),
        isExhausted: false,
      },
      {
        items: Array.from({ length: 1000 }, (_, index) =>
          submission(2000 - index)
        ),
        isExhausted: false,
      },
      { items: [submission(1000), submission(999)], isExhausted: true },
    ];
    const calls: number[] = [];
    const result = await collectNewSubmissionPages({
      cursor: "1000",
      pageSize: 1000,
      fetchPage: async from => {
        calls.push(from);
        return {
          status: "success",
          observedAt: new Date(),
          data: pages[(from - 1) / 1000]!,
        };
      },
    });
    expect(result).toMatchObject({
      status: "success",
      data: { scannedPages: 3 },
    });
    if (result.status === "success")
      expect(result.data.items).toHaveLength(2000);
    expect(calls).toEqual([1, 1001, 2001]);
  });

  it("maps only a known stable external key to its canonical problem record", () => {
    const canonicalIds = new Map([
      ["4-A", 7],
      ["4-B", 8],
    ]);
    expect(canonicalProblemIdForExternalKey("4-A", canonicalIds)).toBe(7);
    expect(canonicalProblemIdForExternalKey("999-A", canonicalIds)).toBeNull();
  });
});
