import { describe, expect, it } from "vitest";

import { areLocationEquals, createDeviceLocation, hasCoordinates, type LocationPreference } from "./location";

describe("areLocationEquals", () => {
  it("returns true for two null locations", () => {
    const result = areLocationEquals(null as unknown as LocationPreference, null as unknown as LocationPreference);
    expect(result).toBe(true);
  });

  it("returns true for locations with identical coordinates", () => {
    const location1: LocationPreference = {
      label: { display: "Location 1", compact: "L1" },
      coordinates: { latitude: 48.8566, longitude: 2.3522 },
      isDeviceLocation: true
    };
    const location2: LocationPreference = {
      label: { display: "Location 2", compact: "L2" },
      coordinates: { latitude: 48.8566, longitude: 2.3522 },
      isDeviceLocation: false
    };

    expect(areLocationEquals(location1, location2)).toBe(true);
  });

  it("returns false for locations with different latitude", () => {
    const location1: LocationPreference = {
      label: { display: "Location 1", compact: "L1" },
      coordinates: { latitude: 48.8566, longitude: 2.3522 },
      isDeviceLocation: true
    };
    const location2: LocationPreference = {
      label: { display: "Location 2", compact: "L2" },
      coordinates: { latitude: 51.5074, longitude: 2.3522 },
      isDeviceLocation: true
    };

    expect(areLocationEquals(location1, location2)).toBe(false);
  });

  it("returns false for locations with different longitude", () => {
    const location1: LocationPreference = {
      label: { display: "Location 1", compact: "L1" },
      coordinates: { latitude: 48.8566, longitude: 2.3522 },
      isDeviceLocation: true
    };
    const location2: LocationPreference = {
      label: { display: "Location 2", compact: "L2" },
      coordinates: { latitude: 48.8566, longitude: -0.1278 },
      isDeviceLocation: true
    };

    expect(areLocationEquals(location1, location2)).toBe(false);
  });

  it("returns true for both locations with null coordinates", () => {
    const location1: LocationPreference = {
      label: { display: "Location 1", compact: "L1" },
      coordinates: null,
      isDeviceLocation: true
    };
    const location2: LocationPreference = {
      label: { display: "Location 2", compact: "L2" },
      coordinates: null,
      isDeviceLocation: true
    };

    expect(areLocationEquals(location1, location2)).toBe(true);
  });
});

describe("hasCoordinates", () => {
  it("returns true for location with valid coordinates", () => {
    const location: LocationPreference = {
      label: { display: "Test", compact: "T" },
      coordinates: { latitude: 48.8566, longitude: 2.3522 },
      isDeviceLocation: true
    };

    expect(hasCoordinates(location)).toBe(true);
  });

  it("returns false for location with null coordinates", () => {
    const location: LocationPreference = {
      label: { display: "Test", compact: "T" },
      coordinates: null,
      isDeviceLocation: true
    };

    expect(hasCoordinates(location)).toBe(false);
  });

  it("returns false for null location", () => {
    expect(hasCoordinates(null as unknown as LocationPreference)).toBe(false);
  });

  it("returns false for undefined location", () => {
    expect(hasCoordinates(undefined as unknown as LocationPreference)).toBe(false);
  });
});

describe("createDeviceLocation", () => {
  it("creates a device location with provided coordinates", () => {
    const coordinates = { latitude: 48.8566, longitude: 2.3522 };

    const result = createDeviceLocation(coordinates);

    expect(result.coordinates).toEqual(coordinates);
    expect(result.isDeviceLocation).toBe(true);
    expect(result.label.display).toBe("Current position");
    expect(result.label.compact).toBe("Near You");
  });

  it("creates a device location with null coordinates when not provided", () => {
    const result = createDeviceLocation(null);

    expect(result.coordinates).toBeNull();
    expect(result.isDeviceLocation).toBe(true);
  });

  it("creates a new coordinates object (not the same reference)", () => {
    const coordinates = { latitude: 48.8566, longitude: 2.3522 };

    const result = createDeviceLocation(coordinates);

    expect(result.coordinates).not.toBe(coordinates);
    expect(result.coordinates).toEqual(coordinates);
  });
});
