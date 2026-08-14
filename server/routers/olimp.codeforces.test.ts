import { describe, expect, it, vi } from "vitest";
import { fetchCodeforces } from "./olimp";

describe("Codeforces transport boundary", () => {
  it("returns a validated official API result", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: "OK", result: { problems: [] } }),
      })
    );
    await expect(
      fetchCodeforces<{ problems: unknown[] }>("problemset.problems")
    ).resolves.toEqual({ problems: [] });
  });

  it("converts HTTP and network failures into safe gateway errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(fetchCodeforces("problemset.problems")).rejects.toMatchObject({
      code: "BAD_GATEWAY",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network unavailable"))
    );
    await expect(fetchCodeforces("problemset.problems")).rejects.toMatchObject({
      code: "BAD_GATEWAY",
    });
  });

  it("returns a controlled validation error when the provider rejects a request", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: "FAILED", comment: "bad handle" }),
      })
    );
    await expect(fetchCodeforces("user.status")).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "bad handle",
    });
  });
});
