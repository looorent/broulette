import { describe, expect, it } from "vitest";

import type { DistanceRangeOption } from "./distance";
import type { LocationPreference } from "./location";
import { equalsPreferences, preferenceFactory, type Preference } from "./preference";
import type { ServicePreference } from "./service";

function createMockService(id: string = "service-1"): ServicePreference {
  return {
    id,
    label: { display: "Today lunch", compact: "Lunch" },
    iconName: "sun",
    date: new Date(2024, 2, 15, 12, 30, 0),
    timeslot: "Lunch",
    isAvailable: true
  };
}

function createMockLocation(lat: number | null = 48.8566, lng: number | null = 2.3522): LocationPreference {
  return {
    label: { display: "Current position", compact: "Near You" },
    coordinates: lat !== null && lng !== null ? { latitude: lat, longitude: lng } : null,
    isDeviceLocation: true
  };
}

function createMockRange(id: string = "MidRange"): DistanceRangeOption {
  return {
    id: id as "Close" | "MidRange" | "Far",
    label: { display: "Drive" }
  };
}

function createMockPreference(overrides: Partial<Preference> = {}): Preference {
  return {
    id: "test-preference-id",
    service: createMockService(),
    location: createMockLocation(),
    isDeviceLocationAttempted: false,
    range: createMockRange(),
    isValid: true,
    hasValidLocation: true,
    ...overrides
  };
}

describe("equalsPreferences", () => {
  it("returns true for preferences with the same id", () => {
    const pref1 = createMockPreference({ id: "same-id" });
    const pref2 = createMockPreference({ id: "same-id" });

    expect(equalsPreferences(pref1, pref2)).toBe(true);
  });

  it("returns false for preferences with different ids", () => {
    const pref1 = createMockPreference({ id: "id-1" });
    const pref2 = createMockPreference({ id: "id-2" });

    expect(equalsPreferences(pref1, pref2)).toBe(false);
  });
});

describe("preferenceFactory", () => {
  describe("withLocation", () => {
    it("returns a new preference with updated location", () => {
      const original = createMockPreference();
      const newLocation = createMockLocation(51.5074, -0.1278);

      const result = preferenceFactory.withLocation(original, newLocation);

      expect(result).not.toBe(original);
      expect(result.location).toBe(newLocation);
    });

    it("returns the same preference if location is unchanged", () => {
      const original = createMockPreference();

      const result = preferenceFactory.withLocation(original, original.location);

      expect(result).toBe(original);
    });

    it("returns the same preference if location coordinates are equal", () => {
      const original = createMockPreference();
      const sameLocation = createMockLocation(48.8566, 2.3522);

      const result = preferenceFactory.withLocation(original, sameLocation);

      expect(result).toBe(original);
    });

    it("returns new preference when coordinates differ", () => {
      const original = createMockPreference();
      const differentLocation = createMockLocation(48.8567, 2.3523);

      const result = preferenceFactory.withLocation(original, differentLocation);

      expect(result).not.toBe(original);
    });
  });

  describe("withService", () => {
    it("returns a new preference with updated service", () => {
      const original = createMockPreference();
      const newService = createMockService("service-2");

      const result = preferenceFactory.withService(original, newService);

      expect(result).not.toBe(original);
      expect(result.service).toBe(newService);
    });

    it("returns the same preference if service is unchanged", () => {
      const original = createMockPreference();

      const result = preferenceFactory.withService(original, original.service);

      expect(result).toBe(original);
    });

    it("returns the same preference if service id is equal", () => {
      const original = createMockPreference();
      const sameService = { ...createMockService(), id: original.service.id };

      const result = preferenceFactory.withService(original, sameService);

      expect(result).toBe(original);
    });
  });

  describe("withDeviceLocationAttempted", () => {
    it("returns a new preference with isDeviceLocationAttempted set to true", () => {
      const original = createMockPreference({ isDeviceLocationAttempted: false });

      const result = preferenceFactory.withDeviceLocationAttempted(original);

      expect(result).not.toBe(original);
      expect(result.isDeviceLocationAttempted).toBe(true);
    });

    it("returns the same preference if already attempted", () => {
      const original = createMockPreference({ isDeviceLocationAttempted: true });

      const result = preferenceFactory.withDeviceLocationAttempted(original);

      expect(result).toBe(original);
    });
  });

  describe("withRange", () => {
    it("returns a new preference with updated range", () => {
      const original = createMockPreference();
      const newRange = createMockRange("Far");

      const result = preferenceFactory.withRange(original, newRange);

      expect(result).not.toBe(original);
      expect(result.range).toBe(newRange);
    });

    it("returns the same preference if range is unchanged", () => {
      const original = createMockPreference();

      const result = preferenceFactory.withRange(original, original.range);

      expect(result).toBe(original);
    });

    it("returns the same preference if range id is equal", () => {
      const original = createMockPreference();
      const sameRange = { ...createMockRange(), id: original.range.id };

      const result = preferenceFactory.withRange(original, sameRange);

      expect(result).toBe(original);
    });
  });

  describe("createDefaultPreference", () => {
    it("creates a preference with the second service and range options", () => {
      const services = [createMockService("service-0"), createMockService("service-1")];
      const ranges = [createMockRange("Close"), createMockRange("MidRange")];
      const coordinates = { latitude: 48.8566, longitude: 2.3522 };

      const result = preferenceFactory.createDefaultPreference(services, ranges, coordinates);

      expect(result.service).toBe(services[1]);
      expect(result.range).toBe(ranges[1]);
    });

    it("creates a preference with device location from coordinates", () => {
      const services = [createMockService("service-0"), createMockService("service-1")];
      const ranges = [createMockRange("Close"), createMockRange("MidRange")];
      const coordinates = { latitude: 48.8566, longitude: 2.3522 };

      const result = preferenceFactory.createDefaultPreference(services, ranges, coordinates);

      expect(result.location.coordinates).toEqual(coordinates);
      expect(result.location.isDeviceLocation).toBe(true);
    });

    it("creates a preference with null coordinates when not provided", () => {
      const services = [createMockService("service-0"), createMockService("service-1")];
      const ranges = [createMockRange("Close"), createMockRange("MidRange")];

      const result = preferenceFactory.createDefaultPreference(services, ranges, null);

      expect(result.location.coordinates).toBeNull();
      expect(result.hasValidLocation).toBe(false);
      expect(result.isValid).toBe(false);
    });

    it("sets isDeviceLocationAttempted to false", () => {
      const services = [createMockService("service-0"), createMockService("service-1")];
      const ranges = [createMockRange("Close"), createMockRange("MidRange")];
      const coordinates = { latitude: 48.8566, longitude: 2.3522 };

      const result = preferenceFactory.createDefaultPreference(services, ranges, coordinates);

      expect(result.isDeviceLocationAttempted).toBe(false);
    });

    it("sets isValid to true when all components are valid", () => {
      const services = [createMockService("service-0"), createMockService("service-1")];
      const ranges = [createMockRange("Close"), createMockRange("MidRange")];
      const coordinates = { latitude: 48.8566, longitude: 2.3522 };

      const result = preferenceFactory.createDefaultPreference(services, ranges, coordinates);

      expect(result.isValid).toBe(true);
      expect(result.hasValidLocation).toBe(true);
    });
  });
});
