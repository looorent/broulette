import { describe, expect, it } from "vitest";

import { computeDistanceInMeters, computeViewportFromCircle } from "./compute";

describe("computeViewportFromCircle", () => {
  it("creates a viewport from a center point and radius", () => {
    const center = { latitude: 48.8566, longitude: 2.3522 };
    const radiusMeters = 1000;

    const viewport = computeViewportFromCircle(center, radiusMeters);

    expect(viewport.bottomLeft.latitude).toBeLessThan(center.latitude);
    expect(viewport.bottomLeft.longitude).toBeLessThan(center.longitude);
    expect(viewport.topRight.latitude).toBeGreaterThan(center.latitude);
    expect(viewport.topRight.longitude).toBeGreaterThan(center.longitude);
  });

  it("creates symmetric offsets around the center", () => {
    const center = { latitude: 48.8566, longitude: 2.3522 };
    const radiusMeters = 1000;

    const viewport = computeViewportFromCircle(center, radiusMeters);

    const latOffset = center.latitude - viewport.bottomLeft.latitude;
    const latOffsetTop = viewport.topRight.latitude - center.latitude;
    expect(latOffset).toBeCloseTo(latOffsetTop, 10);

    const lonOffset = center.longitude - viewport.bottomLeft.longitude;
    const lonOffsetRight = viewport.topRight.longitude - center.longitude;
    expect(lonOffset).toBeCloseTo(lonOffsetRight, 10);
  });

  it("creates a larger viewport for a larger radius", () => {
    const center = { latitude: 48.8566, longitude: 2.3522 };

    const smallViewport = computeViewportFromCircle(center, 500);
    const largeViewport = computeViewportFromCircle(center, 2000);

    const smallLatSpan = smallViewport.topRight.latitude - smallViewport.bottomLeft.latitude;
    const largeLatSpan = largeViewport.topRight.latitude - largeViewport.bottomLeft.latitude;

    expect(largeLatSpan).toBeGreaterThan(smallLatSpan);
  });

  it("handles equator coordinates", () => {
    const center = { latitude: 0, longitude: 0 };
    const radiusMeters = 1000;

    const viewport = computeViewportFromCircle(center, radiusMeters);

    expect(viewport.bottomLeft.latitude).toBeLessThan(0);
    expect(viewport.topRight.latitude).toBeGreaterThan(0);
  });

  it("handles high latitude coordinates", () => {
    const center = { latitude: 70, longitude: 25 };
    const radiusMeters = 1000;

    const viewport = computeViewportFromCircle(center, radiusMeters);

    expect(viewport.bottomLeft.latitude).toBeLessThan(center.latitude);
    expect(viewport.topRight.latitude).toBeGreaterThan(center.latitude);
  });
});

describe("computeDistanceInMeters", () => {
  it("returns 0 for the same coordinates", () => {
    const point = { latitude: 48.8566, longitude: 2.3522 };

    const distance = computeDistanceInMeters(point, point);

    expect(distance).toBe(0);
  });

  it("computes distance between Paris and London", () => {
    const paris = { latitude: 48.8566, longitude: 2.3522 };
    const london = { latitude: 51.5074, longitude: -0.1278 };

    const distance = computeDistanceInMeters(paris, london);

    expect(distance).toBeGreaterThan(340_000);
    expect(distance).toBeLessThan(350_000);
  });

  it("computes distance between nearby points", () => {
    const pointA = { latitude: 48.8566, longitude: 2.3522 };
    const pointB = { latitude: 48.8576, longitude: 2.3532 };

    const distance = computeDistanceInMeters(pointA, pointB);

    expect(distance).toBeGreaterThan(100);
    expect(distance).toBeLessThan(200);
  });

  it("is symmetric (distance A to B equals B to A)", () => {
    const pointA = { latitude: 48.8566, longitude: 2.3522 };
    const pointB = { latitude: 51.5074, longitude: -0.1278 };

    const distanceAB = computeDistanceInMeters(pointA, pointB);
    const distanceBA = computeDistanceInMeters(pointB, pointA);

    expect(distanceAB).toBe(distanceBA);
  });

  it("handles antipodal points", () => {
    const pointA = { latitude: 0, longitude: 0 };
    const pointB = { latitude: 0, longitude: 180 };

    const distance = computeDistanceInMeters(pointA, pointB);

    expect(distance).toBeGreaterThan(20_000_000);
  });

  it("handles crossing the prime meridian", () => {
    const pointA = { latitude: 51.5, longitude: -0.5 };
    const pointB = { latitude: 51.5, longitude: 0.5 };

    const distance = computeDistanceInMeters(pointA, pointB);

    expect(distance).toBeGreaterThan(60_000);
    expect(distance).toBeLessThan(80_000);
  });

  it("returns rounded integer values", () => {
    const pointA = { latitude: 48.8566, longitude: 2.3522 };
    const pointB = { latitude: 48.8576, longitude: 2.3532 };

    const distance = computeDistanceInMeters(pointA, pointB);

    expect(Number.isInteger(distance)).toBe(true);
  });
});
