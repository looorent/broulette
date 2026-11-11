import { describe, expect, it, vi } from "vitest";

import { loadBalancer } from "./providers";
import { RestaurantDiscoveryScanner } from "./scanner";
import type { DiscoveryConfiguration, DiscoveryRestaurantIdentity } from "./types";

vi.mock("./providers", () => ({
  loadBalancer: vi.fn().mockReturnValue({
    execute: vi.fn()
  })
}));

const mockedLoadBalancer = vi.mocked(loadBalancer);

function createMockConfiguration(): DiscoveryConfiguration {
  return {
    maxDiscoveryIterations: 3,
    rangeIncreaseMeters: 500,
    cacheFreshForSeconds: 60,
    cacheKeptForSeconds: 120
  };
}

describe("RestaurantDiscoveryScanner", () => {
  describe("constructor", () => {
    it("initializes with zero iterations", () => {
      const scanner = new RestaurantDiscoveryScanner(
        { latitude: 48.8566, longitude: 2.3522 },
        1000,
        30000,
        createMockConfiguration(),
        undefined,
        []
      );

      expect(scanner.isOver).toBe(false);
    });

    it("stores initial identities to exclude", () => {
      const initialIdentities: DiscoveryRestaurantIdentity[] = [
        { source: "osm", externalId: "123", externalType: "node" }
      ];

      const scanner = new RestaurantDiscoveryScanner(
        { latitude: 48.8566, longitude: 2.3522 },
        1000,
        30000,
        createMockConfiguration(),
        undefined,
        initialIdentities
      );

      expect(scanner.isOver).toBe(false);
    });
  });

  describe("nextRestaurants", () => {
    it("returns empty array when scanner is over", async () => {
      const config = { ...createMockConfiguration(), maxDiscoveryIterations: 0 };
      const scanner = new RestaurantDiscoveryScanner(
        { latitude: 48.8566, longitude: 2.3522 },
        1000,
        30000,
        config,
        undefined,
        []
      );

      const result = await scanner.nextRestaurants(undefined);

      expect(result).toEqual([]);
    });

    it("calls load balancer with correct parameters", async () => {
      const mockExecute = vi.fn().mockResolvedValue([]);
      mockedLoadBalancer.mockReturnValue({ execute: mockExecute } as any);

      const scanner = new RestaurantDiscoveryScanner(
        { latitude: 48.8566, longitude: 2.3522 },
        1000,
        30000,
        createMockConfiguration(),
        undefined,
        []
      );

      await scanner.nextRestaurants(undefined);

      expect(mockExecute).toHaveBeenCalledWith(
        { latitude: 48.855, longitude: 2.35 },
        1400,
        30,
        [],
        undefined
      );
    });

    it("increases range on each iteration", async () => {
      const mockExecute = vi.fn().mockResolvedValue([]);
      mockedLoadBalancer.mockReturnValue({ execute: mockExecute } as any);

      const config = createMockConfiguration();
      const scanner = new RestaurantDiscoveryScanner(
        { latitude: 48.8566, longitude: 2.3522 },
        1000,
        30000,
        config,
        undefined,
        []
      );

      await scanner.nextRestaurants(undefined);
      await scanner.nextRestaurants(undefined);

      expect(mockExecute).toHaveBeenNthCalledWith(2,
        { latitude: 48.855, longitude: 2.35 },
        1900,
        30,
        [],
        undefined
      );
    });

    it("returns restaurants from load balancer", async () => {
      const mockRestaurants = [
        { name: "Restaurant 1", latitude: 48.8566, longitude: 2.3522, source: "osm", externalId: "1", externalType: "node" },
        { name: "Restaurant 2", latitude: 48.8567, longitude: 2.3523, source: "osm", externalId: "2", externalType: "node" }
      ];
      const mockExecute = vi.fn().mockResolvedValue(mockRestaurants);
      mockedLoadBalancer.mockReturnValue({ execute: mockExecute } as any);

      const scanner = new RestaurantDiscoveryScanner(
        { latitude: 48.8566, longitude: 2.3522 },
        1000,
        30000,
        createMockConfiguration(),
        undefined,
        []
      );

      const result = await scanner.nextRestaurants(undefined);

      expect(result).toEqual(mockRestaurants);
    });

    it("throws error when load balancer fails", async () => {
      const mockExecute = vi.fn().mockRejectedValue(new Error("Network error"));
      mockedLoadBalancer.mockReturnValue({ execute: mockExecute } as any);

      const scanner = new RestaurantDiscoveryScanner(
        { latitude: 48.8566, longitude: 2.3522 },
        1000,
        30000,
        createMockConfiguration(),
        undefined,
        []
      );

      await expect(scanner.nextRestaurants(undefined)).rejects.toThrow("Network error");
    });
  });

  describe("addIdentityToExclude", () => {
    it("adds identity to exclusion list", async () => {
      const mockExecute = vi.fn().mockResolvedValue([]);
      mockedLoadBalancer.mockReturnValue({ execute: mockExecute } as any);

      const scanner = new RestaurantDiscoveryScanner(
        { latitude: 48.8566, longitude: 2.3522 },
        1000,
        30000,
        createMockConfiguration(),
        undefined,
        []
      );

      const identity = {
        id: "profile-1",
        source: "osm",
        externalId: "123",
        externalType: "node",
        restaurantId: "restaurant-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        latitude: 48.8566,
        longitude: 2.3522,
        name: null,
        address: null,
        countryCode: null,
        state: null,
        description: null,
        photoId: null,
        mapUrl: null,
        rating: null,
        ratingCount: null,
        phoneNumber: null,
        internationalPhoneNumber: null,
        priceRange: null,
        priceLabel: null,
        openingHours: null,
        tags: [],
        operational: null,
        website: null,
        sourceUrl: null
      };

      mockExecute.mockResolvedValue([
        { name: "Excluded", latitude: 48.8566, longitude: 2.3522, source: "osm", externalId: "123", externalType: "node" },
        { name: "Kept", latitude: 48.8566, longitude: 2.3522, source: "osm", externalId: "456", externalType: "node" }
      ]);

      scanner.addIdentityToExclude(identity);
      const result = await scanner.nextRestaurants(undefined);

      expect(result.map(restaurant => restaurant.externalId)).toEqual(["456"]);
    });

    it("ignores duplicate identities", async () => {
      const mockExecute = vi.fn().mockResolvedValue([]);
      mockedLoadBalancer.mockReturnValue({ execute: mockExecute } as any);

      const scanner = new RestaurantDiscoveryScanner(
        { latitude: 48.8566, longitude: 2.3522 },
        1000,
        30000,
        createMockConfiguration(),
        undefined,
        []
      );

      const identity = {
        id: "profile-1",
        source: "osm",
        externalId: "123",
        externalType: "node",
        restaurantId: "restaurant-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        latitude: 48.8566,
        longitude: 2.3522,
        name: null,
        address: null,
        countryCode: null,
        state: null,
        description: null,
        photoId: null,
        mapUrl: null,
        rating: null,
        ratingCount: null,
        phoneNumber: null,
        internationalPhoneNumber: null,
        priceRange: null,
        priceLabel: null,
        openingHours: null,
        tags: [],
        operational: null,
        website: null,
        sourceUrl: null
      };

      mockExecute.mockResolvedValue([
        { name: "Excluded", latitude: 48.8566, longitude: 2.3522, source: "osm", externalId: "123", externalType: "node" },
        { name: "Kept", latitude: 48.8566, longitude: 2.3522, source: "osm", externalId: "456", externalType: "node" }
      ]);

      scanner.addIdentityToExclude(identity);
      scanner.addIdentityToExclude(identity);
      const result = await scanner.nextRestaurants(undefined);

      expect(result.map(restaurant => restaurant.externalId)).toEqual(["456"]);
    });

    it("returns this for chaining", () => {
      const scanner = new RestaurantDiscoveryScanner(
        { latitude: 48.8566, longitude: 2.3522 },
        1000,
        30000,
        createMockConfiguration(),
        undefined,
        []
      );

      const identity = {
        id: "profile-1",
        source: "osm",
        externalId: "123",
        externalType: "node",
        restaurantId: "restaurant-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        latitude: 48.8566,
        longitude: 2.3522,
        name: null,
        address: null,
        countryCode: null,
        state: null,
        description: null,
        photoId: null,
        mapUrl: null,
        rating: null,
        ratingCount: null,
        phoneNumber: null,
        internationalPhoneNumber: null,
        priceRange: null,
        priceLabel: null,
        openingHours: null,
        tags: [],
        operational: null,
        website: null,
        sourceUrl: null
      };

      const result = scanner.addIdentityToExclude(identity);

      expect(result).toBe(scanner);
    });
  });

  describe("isOver", () => {
    it("returns false when iterations are below max", async () => {
      const mockExecute = vi.fn().mockResolvedValue([]);
      mockedLoadBalancer.mockReturnValue({ execute: mockExecute } as any);

      const config = { ...createMockConfiguration(), maxDiscoveryIterations: 3 };
      const scanner = new RestaurantDiscoveryScanner(
        { latitude: 48.8566, longitude: 2.3522 },
        1000,
        30000,
        config,
        undefined,
        []
      );

      await scanner.nextRestaurants(undefined);

      expect(scanner.isOver).toBe(false);
    });

    it("returns true when max iterations reached", async () => {
      const mockExecute = vi.fn().mockResolvedValue([]);
      mockedLoadBalancer.mockReturnValue({ execute: mockExecute } as any);

      const config = { ...createMockConfiguration(), maxDiscoveryIterations: 2 };
      const scanner = new RestaurantDiscoveryScanner(
        { latitude: 48.8566, longitude: 2.3522 },
        1000,
        30000,
        config,
        undefined,
        []
      );

      await scanner.nextRestaurants(undefined);
      await scanner.nextRestaurants(undefined);

      expect(scanner.isOver).toBe(true);
    });
  });

  describe("timeoutInSeconds", () => {
    it("converts milliseconds to seconds", () => {
      const scanner = new RestaurantDiscoveryScanner(
        { latitude: 48.8566, longitude: 2.3522 },
        1000,
        30000,
        createMockConfiguration(),
        undefined,
        []
      );

      expect(scanner.timeoutInSeconds).toBe(30);
    });
  });

  describe("fallbacks", () => {
    const nearBy = { latitude: 48.8566, longitude: 2.3522 };
    const cacheKey = "discovery:v1:48.855:2.350:1400";
    const nearbyRestaurant = { name: "Nearby", latitude: 48.8570, longitude: 2.3525, source: "osm", externalId: "1", externalType: "node" };
    const farRestaurant = { name: "Far", latitude: 48.8700, longitude: 2.3522, source: "osm", externalId: "2", externalType: "node" };

    function createKeyStore(entries: Record<string, unknown> = {}) {
      const store = new Map(Object.entries(entries).map(([key, value]) => [key, JSON.stringify(value)]));
      return {
        store,
        get: vi.fn(async (key: string) => store.has(key) ? JSON.parse(store.get(key)!) : null),
        put: vi.fn(async (key: string, value: string) => {
          store.set(key, value);
        })
      };
    }

    function createScanner(keyStore: ReturnType<typeof createKeyStore> | undefined, findKnownRestaurants = vi.fn().mockResolvedValue([])) {
      return new RestaurantDiscoveryScanner(nearBy, 1000, 30000, createMockConfiguration(), undefined, [], {
        cache: keyStore ? { keyStore: keyStore as unknown as KVNamespace, freshForSeconds: 60, keptForSeconds: 120 } : undefined,
        findKnownRestaurants
      });
    }

    function overpassReturns(result: Promise<unknown>) {
      const mockExecute = vi.fn().mockReturnValue(result);
      mockedLoadBalancer.mockReturnValue({ execute: mockExecute } as any);
      return mockExecute;
    }

    it("serves a fresh cache entry without calling overpass", async () => {
      const mockExecute = overpassReturns(Promise.resolve([]));
      const keyStore = createKeyStore({ [cacheKey]: { storedAt: Date.now(), restaurants: [nearbyRestaurant] } });

      const result = await createScanner(keyStore).nextRestaurants(undefined);

      expect(result).toEqual([nearbyRestaurant]);
      expect(mockExecute).not.toHaveBeenCalled();
    });

    it("stores overpass results in the cache", async () => {
      overpassReturns(Promise.resolve([nearbyRestaurant]));
      const keyStore = createKeyStore();

      await createScanner(keyStore).nextRestaurants(undefined);

      expect(JSON.parse(keyStore.store.get(cacheKey)!).restaurants).toEqual([nearbyRestaurant]);
    });

    it("refreshes a stale cache entry from overpass", async () => {
      const mockExecute = overpassReturns(Promise.resolve([nearbyRestaurant]));
      const keyStore = createKeyStore({ [cacheKey]: { storedAt: Date.now() - 61_000, restaurants: [] } });

      const result = await createScanner(keyStore).nextRestaurants(undefined);

      expect(mockExecute).toHaveBeenCalled();
      expect(result).toEqual([nearbyRestaurant]);
    });

    it("serves a stale cache entry when overpass fails", async () => {
      overpassReturns(Promise.reject(new Error("All providers failed.")));
      const keyStore = createKeyStore({ [cacheKey]: { storedAt: Date.now() - 61_000, restaurants: [nearbyRestaurant] } });

      const result = await createScanner(keyStore).nextRestaurants(undefined);

      expect(result).toEqual([nearbyRestaurant]);
    });

    it("serves known restaurants when overpass fails and nothing is cached", async () => {
      overpassReturns(Promise.reject(new Error("All providers failed.")));
      const findKnownRestaurants = vi.fn().mockResolvedValue([nearbyRestaurant]);

      const result = await createScanner(createKeyStore(), findKnownRestaurants).nextRestaurants(undefined);

      expect(result).toEqual([nearbyRestaurant]);
      expect(findKnownRestaurants).toHaveBeenCalledWith({ center: { latitude: 48.855, longitude: 2.35 }, rangeInMeters: 1400 });
    });

    it("rethrows the overpass error when no fallback has restaurants", async () => {
      overpassReturns(Promise.reject(new Error("All providers failed.")));

      await expect(createScanner(createKeyStore()).nextRestaurants(undefined)).rejects.toThrow("All providers failed.");
    });

    it("keeps only restaurants within the requested range", async () => {
      overpassReturns(Promise.resolve([nearbyRestaurant, farRestaurant]));

      const result = await createScanner(undefined).nextRestaurants(undefined);

      expect(result).toEqual([nearbyRestaurant]);
    });

    it("keeps working when the cache is unavailable", async () => {
      overpassReturns(Promise.resolve([nearbyRestaurant]));
      const keyStore = createKeyStore();
      keyStore.get.mockRejectedValue(new Error("KV down"));
      keyStore.put.mockRejectedValue(new Error("KV down"));

      const result = await createScanner(keyStore).nextRestaurants(undefined);

      expect(result).toEqual([nearbyRestaurant]);
    });
  });
});
