import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@features/circuit-breaker.server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/circuit-breaker.server")>();
  return {
    ...actual,
    circuitBreaker: () => ({
      execute: async <T>(fn: (signal?: AbortSignal) => Promise<T>) => fn(new AbortController().signal)
    })
  };
});

import { fetchLocationFromPhoton } from "./client";
import type { PhotonConfiguration } from "./types";

const mockConfig: PhotonConfiguration = {
  enabled: true,
  instanceUrls: ["https://photon.test.com/api"],
  bottomNote: "Powered by Photon",
  maxNumberOfAddresses: 5,
  failover: {
    retry: 0,
    halfOpenAfterInMs: 1000,
    timeoutInMs: 5000,
    consecutiveFailures: 3
  }
};

describe("Photon Client", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("fetchLocationFromPhoton", () => {
    it("returns empty locations for empty API response", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ features: [] })
      }));

      const result = await fetchLocationFromPhoton("Brussels", mockConfig.instanceUrls[0], mockConfig);

      expect(result.locations).toEqual([]);
      expect(result.note).toBe("Powered by Photon");
    });

    it("parses valid photon response correctly", async () => {
      const mockResponse = {
        features: [
          {
            geometry: {
              coordinates: [4.3517, 50.8503] // lon, lat order (GeoJSON)
            },
            properties: {
              osm_id: 123,
              name: "Brussels",
              city: "Brussels",
              country: "Belgium"
            }
          }
        ]
      };

      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));

      const result = await fetchLocationFromPhoton("Brussels", mockConfig.instanceUrls[0], mockConfig);

      expect(result.locations).toHaveLength(1);
      expect(result.locations[0]).toEqual({
        label: {
          display: "Brussels, Brussels, Belgium",
          compact: "Brussels"
        },
        coordinates: {
          latitude: 50.8503,
          longitude: 4.3517
        },
        isDeviceLocation: false
      });
    });

    it("handles location with only street and house number", async () => {
      const mockResponse = {
        features: [
          {
            geometry: {
              coordinates: [4.35, 50.85]
            },
            properties: {
              street: "Main Street",
              housenumber: "123",
              city: "Brussels",
              country: "Belgium"
            }
          }
        ]
      };

      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));

      const result = await fetchLocationFromPhoton("Main Street", mockConfig.instanceUrls[0], mockConfig);

      expect(result.locations[0].label.display).toBe("Main Street 123, Brussels, Belgium");
      expect(result.locations[0].label.compact).toBe("Brussels");
    });

    it("uses city as compact name when name is missing", async () => {
      const mockResponse = {
        features: [
          {
            geometry: {
              coordinates: [4.35, 50.85]
            },
            properties: {
              city: "Antwerp",
              country: "Belgium"
            }
          }
        ]
      };

      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));

      const result = await fetchLocationFromPhoton("Antwerp", mockConfig.instanceUrls[0], mockConfig);

      expect(result.locations[0].label.compact).toBe("Antwerp");
    });

    it("uses display name as compact when name and city are missing", async () => {
      const mockResponse = {
        features: [
          {
            geometry: {
              coordinates: [4.35, 50.85]
            },
            properties: {
              country: "Belgium"
            }
          }
        ]
      };

      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));

      const result = await fetchLocationFromPhoton("Belgium", mockConfig.instanceUrls[0], mockConfig);

      expect(result.locations[0].label.compact).toBe("Belgium");
    });

    it("handles empty properties gracefully", async () => {
      const mockResponse = {
        features: [
          {
            geometry: {
              coordinates: [4.35, 50.85]
            },
            properties: {}
          }
        ]
      };

      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));

      const result = await fetchLocationFromPhoton("Unknown", mockConfig.instanceUrls[0], mockConfig);

      expect(result.locations[0].label.display).toBe("Unknown Location");
    });

    it("filters out entries with invalid coordinates", async () => {
      const mockResponse = {
        features: [
          {
            geometry: {
              coordinates: [4.35, 50.85]
            },
            properties: { name: "Valid" }
          },
          {
            geometry: {
              coordinates: [] // empty
            },
            properties: { name: "Invalid" }
          },
          {
            geometry: {
              coordinates: [4.35] // only one coordinate
            },
            properties: { name: "Also Invalid" }
          },
          {
            properties: { name: "No geometry" }
          }
        ]
      };

      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));

      const result = await fetchLocationFromPhoton("Test", mockConfig.instanceUrls[0], mockConfig);

      expect(result.locations).toHaveLength(1);
      expect(result.locations[0].label.compact).toBe("Valid");
    });

    it("includes location bias parameters when provided", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ features: [] })
      }));

      await fetchLocationFromPhoton(
        "Restaurant",
        mockConfig.instanceUrls[0],
        mockConfig,
        { latitude: 50.85, longitude: 4.35 }
      );

      const fetchCall = vi.mocked(fetch).mock.calls[0];
      const url = fetchCall[0] as string;

      expect(url).toContain("lat=50.85");
      expect(url).toContain("lon=4.35");
    });

    it("does not include lat/lon when location bias is not provided", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ features: [] })
      }));

      await fetchLocationFromPhoton("Brussels", mockConfig.instanceUrls[0], mockConfig);

      const fetchCall = vi.mocked(fetch).mock.calls[0];
      const url = fetchCall[0] as string;

      expect(url).not.toContain("lat=");
      expect(url).not.toContain("lon=");
    });

    it("includes osm_tag filters for cities and towns", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ features: [] })
      }));

      await fetchLocationFromPhoton("Brussels", mockConfig.instanceUrls[0], mockConfig);

      const fetchCall = vi.mocked(fetch).mock.calls[0];
      const url = fetchCall[0] as string;

      expect(url).toContain("osm_tag=place%3Acity");
      expect(url).toContain("osm_tag=place%3Atown");
    });

    it("includes correct query parameters", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ features: [] })
      }));

      await fetchLocationFromPhoton("Brussels", mockConfig.instanceUrls[0], mockConfig);

      const fetchCall = vi.mocked(fetch).mock.calls[0];
      const url = fetchCall[0] as string;

      expect(url).toContain("q=Brussels");
      expect(url).toContain("limit=5");
    });

    it("throws error on non-ok response", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Internal Server Error")
      }));

      await expect(
        fetchLocationFromPhoton("Brussels", mockConfig.instanceUrls[0], mockConfig)
      ).rejects.toThrow();
    });

    it("handles null features array", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ features: null })
      }));

      const result = await fetchLocationFromPhoton("Brussels", mockConfig.instanceUrls[0], mockConfig);

      expect(result.locations).toEqual([]);
    });

    it("handles missing features property", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({})
      }));

      const result = await fetchLocationFromPhoton("Brussels", mockConfig.instanceUrls[0], mockConfig);

      expect(result.locations).toEqual([]);
    });

    it("correctly converts GeoJSON coordinates (lon, lat) to (lat, lon)", async () => {
      const mockResponse = {
        features: [
          {
            geometry: {
              coordinates: [10.123, 45.678] // lon, lat in GeoJSON
            },
            properties: { name: "Test Location" }
          }
        ]
      };

      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));

      const result = await fetchLocationFromPhoton("Test", mockConfig.instanceUrls[0], mockConfig);

      expect(result.locations[0].coordinates).toEqual({
        latitude: 45.678, // lat from index 1
        longitude: 10.123 // lon from index 0
      });
    });
  });
});
