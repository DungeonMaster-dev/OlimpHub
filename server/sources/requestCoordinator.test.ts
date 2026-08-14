import { describe, expect, it, vi } from "vitest";
import {
  SourceRequestCoordinator,
  stableRequestCacheKey,
} from "./requestCoordinator";

describe("source request coordinator", () => {
  it("caches successful responses only until their declared TTL", async () => {
    let now = 0;
    const load = vi
      .fn()
      .mockResolvedValueOnce("first")
      .mockResolvedValueOnce("second");
    const coordinator = new SourceRequestCoordinator({
      minIntervalMs: 0,
      now: () => now,
    });
    await expect(
      coordinator.run({ cacheKey: "catalogue", cacheTtlMs: 100 }, load)
    ).resolves.toBe("first");
    now = 99;
    await expect(
      coordinator.run({ cacheKey: "catalogue", cacheTtlMs: 100 }, load)
    ).resolves.toBe("first");
    now = 100;
    await expect(
      coordinator.run({ cacheKey: "catalogue", cacheTtlMs: 100 }, load)
    ).resolves.toBe("second");
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("does not cache a failed provider request", async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error("temporary provider failure"))
      .mockResolvedValueOnce("recovered");
    const coordinator = new SourceRequestCoordinator({ minIntervalMs: 0 });
    await expect(
      coordinator.run({ cacheKey: "catalogue", cacheTtlMs: 100 }, load)
    ).rejects.toThrow("temporary provider failure");
    await expect(
      coordinator.run({ cacheKey: "catalogue", cacheTtlMs: 100 }, load)
    ).resolves.toBe("recovered");
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("coalesces duplicate in-flight requests and spaces distinct provider calls", async () => {
    let now = 0;
    const starts: number[] = [];
    const coordinator = new SourceRequestCoordinator({
      minIntervalMs: 2200,
      now: () => now,
      sleep: async milliseconds => {
        now += milliseconds;
      },
    });
    const firstLoad = vi.fn(async () => {
      starts.push(now);
      return "first";
    });
    const secondLoad = vi.fn(async () => {
      starts.push(now);
      return "second";
    });
    const [first, duplicate, second] = await Promise.all([
      coordinator.run({ cacheKey: "catalogue", cacheTtlMs: 0 }, firstLoad),
      coordinator.run({ cacheKey: "catalogue", cacheTtlMs: 0 }, firstLoad),
      coordinator.run({ cacheKey: "submissions", cacheTtlMs: 0 }, secondLoad),
    ]);
    expect([first, duplicate, second]).toEqual(["first", "first", "second"]);
    expect(firstLoad).toHaveBeenCalledTimes(1);
    expect(secondLoad).toHaveBeenCalledTimes(1);
    expect(starts).toEqual([0, 2200]);
  });

  it("builds an order-insensitive cache key from normalized request parameters", () => {
    expect(
      stableRequestCacheKey("user.status", { count: "1000", handle: "tourist" })
    ).toBe(
      stableRequestCacheKey("user.status", { handle: "tourist", count: "1000" })
    );
  });
});
