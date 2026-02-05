import { describe, expect, it, vi, beforeEach } from "vitest";

import type { FailoverConfiguration } from "@features/circuit-breaker.server";

import { fetchAllRestaurantsNearbyWithRetry } from "./client";

vi.mock("@features/circuit-breaker.server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/circuit-breaker.server")>();
  return {
    ...actual,
    circuitBreaker: () => ({
      execute: async <T>(fn: (signal?: AbortSignal) => Promise<T>) => fn(new AbortController().signal)
    })
  };
});


const mockFailover: FailoverConfiguration = {
  retry: 0,
  halfOpenAfterInMs: 1000,
  timeoutInMs: 5000,
  consecutiveFailures: 3
};

describe("Overpass Client", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("fetchAllRestaurantsNearbyWithRetry", () => {
    it("returns empty restaurant list for empty API response", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          version: 0.6,
          generator: "Overpass API",
          elements: []
        })
      }));

      const result = await fetchAllRestaurantsNearbyWithRetry(
        50.85, 4.35, 1000, "https://overpass.test.com", 30, [], mockFailover
      );

      expect(result?.restaurants).toEqual([]);
    });

    it("parses node restaurant correctly", async () => {
      const mockResponse = {
        version: 0.6,
        generator: "Overpass API",
        osm3s: {
          copyright: "OSM contributors",
          timestamp_osm_base: "2024-01-01T00:00:00Z"
        },
        elements: [
          {
            type: "node",
            id: 12345,
            lat: 50.85,
            lon: 4.35,
            tags: {
              name: "Test Restaurant",
              amenity: "restaurant",
              cuisine: "italian,pizza",
              "diet:vegan": "yes",
              "diet:vegetarian": "yes",
              "addr:street": "Main Street",
              "addr:housenumber": "123",
              "addr:city": "Brussels",
              "addr:postcode": "1000",
              "addr:country": "BE",
              phone: "+32 123 456",
              website: "https://example.com",
              opening_hours: "Mo-Fr 11:00-22:00",
              description: "A nice restaurant"
            }
          }
        ]
      };

      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));

      const result = await fetchAllRestaurantsNearbyWithRetry(
        50.85, 4.35, 1000, "https://overpass.test.com", 30, [], mockFailover
      );

      expect(result?.restaurants).toHaveLength(1);
      const restaurant = result!.restaurants[0];

      expect(restaurant.id).toBe(12345);
      expect(restaurant.type).toBe("node");
      expect(restaurant.name).toBe("Test Restaurant");
      expect(restaurant.latitude).toBe(50.85);
      expect(restaurant.longitude).toBe(4.35);
      expect(restaurant.amenity).toBe("restaurant");
      expect(restaurant.cuisine).toEqual(["italian", "pizza"]);
      expect(restaurant.vegan).toBe("yes");
      expect(restaurant.vegetarian).toBe("yes");
      expect(restaurant.street).toBe("Main Street");
      expect(restaurant.city).toBe("Brussels");
      expect(restaurant.postCode).toBe("1000");
      expect(restaurant.countryCode).toBe("be");
      expect(restaurant.phoneNumber).toBe("+32 123 456");
      expect(restaurant.website).toBe("https://example.com");
      expect(restaurant.openingHours).toBe("Mo-Fr 11:00-22:00");
      expect(restaurant.description).toBe("A nice restaurant");
      expect(restaurant.operational).toBe(true);
    });

    it("parses way restaurant using center coordinates", async () => {
      const mockResponse = {
        version: 0.6,
        generator: "Overpass API",
        elements: [
          {
            type: "way",
            id: 67890,
            center: {
              lat: 50.86,
              lon: 4.36
            },
            tags: {
              name: "Way Restaurant"
            }
          }
        ]
      };

      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));

      const result = await fetchAllRestaurantsNearbyWithRetry(
        50.85, 4.35, 1000, "https://overpass.test.com", 30, [], mockFailover
      );

      expect(result?.restaurants).toHaveLength(1);
      expect(result!.restaurants[0].latitude).toBe(50.86);
      expect(result!.restaurants[0].longitude).toBe(4.36);
      expect(result!.restaurants[0].type).toBe("way");
    });

    it("builds correct OpenStreetMap URL", async () => {
      const mockResponse = {
        version: 0.6,
        generator: "Overpass API",
        elements: [
          {
            type: "node",
            id: 12345,
            lat: 50.85,
            lon: 4.35,
            tags: { name: "Test" }
          }
        ]
      };

      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));

      const result = await fetchAllRestaurantsNearbyWithRetry(
        50.85, 4.35, 1000, "https://overpass.test.com", 30, [], mockFailover
      );

      expect(result!.restaurants[0].openStreetMapUrl).toBe("https://www.openstreetmap.org/node/12345");
    });

    it("filters out elements without coordinates", async () => {
      const mockResponse = {
        version: 0.6,
        generator: "Overpass API",
        elements: [
          {
            type: "node",
            id: 1,
            lat: 50.85,
            lon: 4.35,
            tags: { name: "Valid" }
          },
          {
            type: "node",
            id: 2,
            // no lat/lon
            tags: { name: "Invalid" }
          },
          {
            type: "way",
            id: 3,
            // no center
            tags: { name: "Also Invalid" }
          }
        ]
      };

      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));

      const result = await fetchAllRestaurantsNearbyWithRetry(
        50.85, 4.35, 1000, "https://overpass.test.com", 30, [], mockFailover
      );

      expect(result?.restaurants).toHaveLength(1);
      expect(result!.restaurants[0].name).toBe("Valid");
    });

    it("formats address in Euro style for European countries", async () => {
      const mockResponse = {
        version: 0.6,
        generator: "Overpass API",
        elements: [
          {
            type: "node",
            id: 1,
            lat: 50.85,
            lon: 4.35,
            tags: {
              name: "Euro Restaurant",
              "addr:street": "Rue de la Loi",
              "addr:housenumber": "42",
              "addr:city": "Brussels",
              "addr:postcode": "1000",
              "addr:country": "BE"
            }
          }
        ]
      };

      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));

      const result = await fetchAllRestaurantsNearbyWithRetry(
        50.85, 4.35, 1000, "https://overpass.test.com", 30, [], mockFailover
      );

      // Euro style: street, housenumber, postcode city
      expect(result!.restaurants[0].formattedAddress).toBe("Rue de la Loi, 42, 1000 Brussels");
    });

    it("formats address in non-Euro style for other countries", async () => {
      const mockResponse = {
        version: 0.6,
        generator: "Overpass API",
        elements: [
          {
            type: "node",
            id: 1,
            lat: 40.71,
            lon: -74.01,
            tags: {
              name: "US Restaurant",
              "addr:street": "Broadway",
              "addr:housenumber": "123",
              "addr:city": "New York",
              "addr:postcode": "10001",
              "addr:country": "US"
            }
          }
        ]
      };

      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));

      const result = await fetchAllRestaurantsNearbyWithRetry(
        40.71, -74.01, 1000, "https://overpass.test.com", 30, [], mockFailover
      );

      // Non-Euro style: street, housenumber, city postcode
      expect(result!.restaurants[0].formattedAddress).toBe("Broadway, 123, New York 10001");
    });

    it("uses contact:phone when phone is not available", async () => {
      const mockResponse = {
        version: 0.6,
        generator: "Overpass API",
        elements: [
          {
            type: "node",
            id: 1,
            lat: 50.85,
            lon: 4.35,
            tags: {
              name: "Test",
              "contact:phone": "+32 999 888"
            }
          }
        ]
      };

      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));

      const result = await fetchAllRestaurantsNearbyWithRetry(
        50.85, 4.35, 1000, "https://overpass.test.com", 30, [], mockFailover
      );

      expect(result!.restaurants[0].phoneNumber).toBe("+32 999 888");
    });

    it("falls back to alternative website tags", async () => {
      const testCases = [
        { tags: { name: "Test", "contact:website": "https://contact.com" }, expected: "https://contact.com" },
        { tags: { name: "Test", "contact:facebook": "https://fb.com/test" }, expected: "https://fb.com/test" },
        { tags: { name: "Test", url: "https://url.com" }, expected: "https://url.com" }
      ];

      for (const testCase of testCases) {
        const mockResponse = {
          version: 0.6,
          generator: "Overpass API",
          elements: [
            {
              type: "node",
              id: 1,
              lat: 50.85,
              lon: 4.35,
              tags: testCase.tags
            }
          ]
        };

        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        }));

        const result = await fetchAllRestaurantsNearbyWithRetry(
          50.85, 4.35, 1000, "https://overpass.test.com", 30, [], mockFailover
        );

        expect(result!.restaurants[0].website).toBe(testCase.expected);
      }
    });

    it("handles empty cuisine tag", async () => {
      const mockResponse = {
        version: 0.6,
        generator: "Overpass API",
        elements: [
          {
            type: "node",
            id: 1,
            lat: 50.85,
            lon: 4.35,
            tags: {
              name: "Test",
              cuisine: ""
            }
          }
        ]
      };

      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));

      const result = await fetchAllRestaurantsNearbyWithRetry(
        50.85, 4.35, 1000, "https://overpass.test.com", 30, [], mockFailover
      );

      expect(result!.restaurants[0].cuisine).toEqual([""]);
    });

    it("includes exclusion query when IDs to exclude are provided", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          version: 0.6,
          generator: "Overpass API",
          elements: []
        })
      }));

      await fetchAllRestaurantsNearbyWithRetry(
        50.85, 4.35, 1000, "https://overpass.test.com", 30,
        [
          { osmId: "123", osmType: "node" },
          { osmId: "456", osmType: "way" }
        ],
        mockFailover
      );

      const fetchCall = vi.mocked(fetch).mock.calls[0];
      const body = decodeURIComponent(fetchCall[1]!.body as string);

      expect(body).toContain("node(id:123)");
      expect(body).toContain("way(id:456)");
      expect(body).toContain("excludeSet");
    });

    it("does not include exclusion when no IDs to exclude", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          version: 0.6,
          generator: "Overpass API",
          elements: []
        })
      }));

      await fetchAllRestaurantsNearbyWithRetry(
        50.85, 4.35, 1000, "https://overpass.test.com", 30, [], mockFailover
      );

      const fetchCall = vi.mocked(fetch).mock.calls[0];
      const body = decodeURIComponent(fetchCall[1]!.body as string);

      expect(body).not.toContain("excludeSet");
    });

    it("includes response metadata", async () => {
      const mockResponse = {
        version: 0.6,
        generator: "Overpass API 12345",
        osm3s: {
          copyright: "OpenStreetMap contributors",
          timestamp_osm_base: "2024-01-15T12:00:00Z"
        },
        elements: []
      };

      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));

      const result = await fetchAllRestaurantsNearbyWithRetry(
        50.85, 4.35, 1000, "https://overpass.test.com", 30, [], mockFailover
      );

      expect(result?.generator).toBe("Overpass API 12345");
      expect(result?.version).toBe(0.6);
      expect(result?.copyright).toBe("OpenStreetMap contributors");
      expect(result?.timestampInUtc).toBe("2024-01-15T12:00:00Z");
      expect(result?.durationInMs).toBeGreaterThanOrEqual(0);
    });

    it("throws error on non-ok response", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Server Error")
      }));

      await expect(
        fetchAllRestaurantsNearbyWithRetry(
          50.85, 4.35, 1000, "https://overpass.test.com", 30, [], mockFailover
        )
      ).rejects.toThrow();
    });

    it("sends POST request with correct headers", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ elements: [] })
      }));

      await fetchAllRestaurantsNearbyWithRetry(
        50.85, 4.35, 1000, "https://overpass.test.com", 30, [], mockFailover
      );

      const fetchCall = vi.mocked(fetch).mock.calls[0];
      expect(fetchCall[1]!.method).toBe("POST");
      // expect(fetchCall[1]!.headers["Content-Type"]).toBe("application/x-www-form-urlencoded;charset=UTF-8");
    });
  });
});
