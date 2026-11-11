import { describe, expect, it } from "vitest";

import { computeDistanceInMeters } from "@features/coordinate";

import { readCachedDiscovery, toCacheableArea } from "./cache";

describe("toCacheableArea", () => {
  it.each([
    { latitude: 0.0025, longitude: 0.0025 },
    { latitude: 50.8466, longitude: 4.3528 },
    { latitude: -33.8688, longitude: 151.2093 },
    { latitude: 69.6492, longitude: 18.9553 }
  ])("contains the whole requested area around %o", (center) => {
    const requested = { center, rangeInMeters: 1500 };

    const cacheable = toCacheableArea(requested);

    const shift = computeDistanceInMeters(requested.center, cacheable.center);
    expect(shift + requested.rangeInMeters).toBeLessThanOrEqual(cacheable.rangeInMeters);
  });

  it("gives the same area to nearby searches", () => {
    const first = toCacheableArea({ center: { latitude: 50.8466, longitude: 4.3528 }, rangeInMeters: 1500 });
    const second = toCacheableArea({ center: { latitude: 50.8469, longitude: 4.3531 }, rangeInMeters: 1500 });

    expect(second).toEqual(first);
  });
});

describe("readCachedDiscovery", () => {
  const area = { center: { latitude: 50.845, longitude: 4.355 }, rangeInMeters: 1900 };

  function keyStoreReturning(value: unknown) {
    return { get: async () => value } as unknown as KVNamespace;
  }

  it("reports an entry younger than the freshness period as fresh", async () => {
    const cached = await readCachedDiscovery({ keyStore: keyStoreReturning({ storedAt: 1_000, restaurants: [] }), freshForSeconds: 60, keptForSeconds: 120 }, area, 60_999);

    expect(cached).toEqual({ restaurants: [], fresh: true });
  });

  it("reports an entry older than the freshness period as stale", async () => {
    const cached = await readCachedDiscovery({ keyStore: keyStoreReturning({ storedAt: 1_000, restaurants: [] }), freshForSeconds: 60, keptForSeconds: 120 }, area, 61_000);

    expect(cached).toEqual({ restaurants: [], fresh: false });
  });

  it("treats a malformed entry as a miss", async () => {
    const cached = await readCachedDiscovery({ keyStore: keyStoreReturning({ unexpected: true }), freshForSeconds: 60, keptForSeconds: 120 }, area);

    expect(cached).toBeUndefined();
  });
});
