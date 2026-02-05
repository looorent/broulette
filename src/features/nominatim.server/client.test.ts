import { describe, expect, it, vi, beforeEach } from "vitest";

// We need to test the internal functions, so we'll test via the exported function
// and mock fetch + circuit breaker
vi.mock("@features/circuit-breaker.server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/circuit-breaker.server")>();
  return {
    ...actual,
    circuitBreaker: () => ({
      execute: async <T>(fn: (signal?: AbortSignal) => Promise<T>) => fn(new AbortController().signal)
    })
  };
});

import { fetchLocationFromNominatim } from "./client";
import type { NominatimConfiguration } from "./types";

const mockConfig: NominatimConfiguration = {
  enabled: true,
  instanceUrls: ["https://nominatim.test.com/search"],
  userAgent: "TestApp/1.0",
  bottomNote: "Powered by Nominatim",
  maxNumberOfAddresses: 5,
  failover: {
    retry: 0,
    halfOpenAfterInMs: 1000,
    timeoutInMs: 5000,
    consecutiveFailures: 3
  }
};

describe("Nominatim Client", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("fetchLocationFromNominatim", () => {
    it("returns empty locations for empty API response", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      }));

      const result = await fetchLocationFromNominatim("Brussels", mockConfig.instanceUrls[0], mockConfig);

      expect(result.locations).toEqual([]);
      expect(result.note).toBe("Powered by Nominatim");
    });

    it("parses valid nominatim response correctly", async () => {
      const mockResponse = [
        {
          place_id: 123,
          name: "Brussels",
          display_name: "Brussels, Brussels-Capital, Belgium",
          class: "place",
          type: "city",
          lat: "50.8503",
          lon: "4.3517"
        }
      ];

      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));

      const result = await fetchLocationFromNominatim("Brussels", mockConfig.instanceUrls[0], mockConfig);

      expect(result.locations).toHaveLength(1);
      expect(result.locations[0]).toEqual({
        label: {
          display: "Brussels, Brussels-Capital, Belgium",
          compact: "Brussels"
        },
        coordinates: {
          latitude: 50.8503,
          longitude: 4.3517
        },
        isDeviceLocation: false
      });
    });

    it("uses display_name first part when name is empty", async () => {
      const mockResponse = [
        {
          place_id: 123,
          name: "",
          display_name: "City Center, Brussels, Belgium",
          class: "place",
          type: "town",
          lat: "50.8503",
          lon: "4.3517"
        }
      ];

      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));

      const result = await fetchLocationFromNominatim("Center", mockConfig.instanceUrls[0], mockConfig);

      expect(result.locations[0].label.compact).toBe("City Center");
    });

    it("filters out excluded types (house, residential)", async () => {
      const mockResponse = [
        {
          place_id: 1,
          name: "Brussels",
          display_name: "Brussels, Belgium",
          class: "place",
          type: "city",
          lat: "50.85",
          lon: "4.35"
        },
        {
          place_id: 2,
          name: "123 Main St",
          display_name: "123 Main St, Brussels",
          class: "place",
          type: "house",
          lat: "50.86",
          lon: "4.36"
        },
        {
          place_id: 3,
          name: "Residential Area",
          display_name: "Residential Area, Brussels",
          class: "place",
          type: "residential",
          lat: "50.87",
          lon: "4.37"
        }
      ];

      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));

      const result = await fetchLocationFromNominatim("Brussels", mockConfig.instanceUrls[0], mockConfig);

      expect(result.locations).toHaveLength(1);
      expect(result.locations[0].label.compact).toBe("Brussels");
    });

    it("filters out non-place classes (keeps place, boundary, highway)", async () => {
      const mockResponse = [
        {
          place_id: 1,
          name: "Brussels",
          display_name: "Brussels, Belgium",
          class: "place",
          type: "city",
          lat: "50.85",
          lon: "4.35"
        },
        {
          place_id: 2,
          name: "Brussels Region",
          display_name: "Brussels Region, Belgium",
          class: "boundary",
          type: "administrative",
          lat: "50.86",
          lon: "4.36"
        },
        {
          place_id: 3,
          name: "Shop Name",
          display_name: "Shop Name, Brussels",
          class: "shop",
          type: "supermarket",
          lat: "50.87",
          lon: "4.37"
        },
        {
          place_id: 4,
          name: "E40 Highway",
          display_name: "E40, Brussels",
          class: "highway",
          type: "motorway",
          lat: "50.88",
          lon: "4.38"
        }
      ];

      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));

      const result = await fetchLocationFromNominatim("Brussels", mockConfig.instanceUrls[0], mockConfig);

      expect(result.locations).toHaveLength(3);
      expect(result.locations.map(l => l.label.compact)).toEqual(["Brussels", "Brussels Region", "E40 Highway"]);
    });

    it("filters out entries without lat/lon", async () => {
      const mockResponse = [
        {
          place_id: 1,
          name: "Valid Place",
          display_name: "Valid Place, Brussels",
          class: "place",
          type: "city",
          lat: "50.85",
          lon: "4.35"
        },
        {
          place_id: 2,
          name: "No Coords",
          display_name: "No Coords, Brussels",
          class: "place",
          type: "city"
          // missing lat/lon
        }
      ];

      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));

      const result = await fetchLocationFromNominatim("Brussels", mockConfig.instanceUrls[0], mockConfig);

      expect(result.locations).toHaveLength(1);
      expect(result.locations[0].label.compact).toBe("Valid Place");
    });

    it("includes viewbox parameter when location bias is provided", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      }));

      await fetchLocationFromNominatim(
        "Restaurant",
        mockConfig.instanceUrls[0],
        mockConfig,
        { latitude: 50.85, longitude: 4.35 }
      );

      expect(fetch).toHaveBeenCalled();
      const fetchCall = vi.mocked(fetch).mock.calls[0];
      const url = fetchCall[0] as string;
      expect(url).toContain("viewbox=");
    });

    it("does not include viewbox when location bias is not provided", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      }));

      await fetchLocationFromNominatim("Brussels", mockConfig.instanceUrls[0], mockConfig);

      expect(fetch).toHaveBeenCalled();
      const fetchCall = vi.mocked(fetch).mock.calls[0];
      const url = fetchCall[0] as string;
      expect(url).not.toContain("viewbox=");
    });

    it("includes correct query parameters", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      }));

      await fetchLocationFromNominatim("Brussels", mockConfig.instanceUrls[0], mockConfig);

      const fetchCall = vi.mocked(fetch).mock.calls[0];
      const url = fetchCall[0] as string;

      expect(url).toContain("q=Brussels");
      expect(url).toContain("format=json");
      expect(url).toContain("limit=5");
      expect(url).toContain("addressdetails=1");
      expect(url).toContain("layer=address");
      expect(url).toContain("dedupe=1");
    });

    it("includes correct headers", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      }));

      await fetchLocationFromNominatim("Brussels", mockConfig.instanceUrls[0], mockConfig);

      const fetchCall = vi.mocked(fetch).mock.calls[0];
      const options = fetchCall[1] as RequestInit;

      expect(options.headers).toEqual({
        "User-Agent": "TestApp/1.0",
        "Accept": "application/json"
      });
    });

    it("throws error on non-ok response", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Internal Server Error")
      }));

      await expect(
        fetchLocationFromNominatim("Brussels", mockConfig.instanceUrls[0], mockConfig)
      ).rejects.toThrow();
    });

    it("handles multiple valid results", async () => {
      const mockResponse = [
        {
          place_id: 1,
          name: "Brussels",
          display_name: "Brussels, Belgium",
          class: "place",
          type: "city",
          lat: "50.85",
          lon: "4.35"
        },
        {
          place_id: 2,
          name: "Brussels Airport",
          display_name: "Brussels Airport, Zaventem, Belgium",
          class: "boundary",
          type: "administrative",
          lat: "50.90",
          lon: "4.48"
        }
      ];

      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));

      const result = await fetchLocationFromNominatim("Brussels", mockConfig.instanceUrls[0], mockConfig);

      expect(result.locations).toHaveLength(2);
      expect(result.locations[0]?.coordinates?.latitude).toBe(50.85);
      expect(result.locations[1]?.coordinates?.latitude).toBe(50.90);
    });
  });
});
