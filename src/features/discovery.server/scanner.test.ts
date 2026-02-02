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
    rangeIncreaseMeters: 500
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
        { latitude: 48.8566, longitude: 2.3522 },
        1000,
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
        { latitude: 48.8566, longitude: 2.3522 },
        1500,
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
        imageUrl: null,
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

      scanner.addIdentityToExclude(identity);
      await scanner.nextRestaurants(undefined);

      expect(mockExecute).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.arrayContaining([expect.objectContaining({ externalId: "123" })]),
        undefined
      );
    });

    it("does not add duplicate identities", async () => {
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
        imageUrl: null,
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

      scanner.addIdentityToExclude(identity);
      scanner.addIdentityToExclude(identity);
      await scanner.nextRestaurants(undefined);

      const callArg = mockExecute.mock.calls[0][3];
      expect(callArg.filter((i: any) => i.externalId === "123")).toHaveLength(1);
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
        imageUrl: null,
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
});
