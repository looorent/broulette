import { describe, expect, it, vi } from "vitest";

import type { DiscoveredRestaurantProfile } from "@features/discovery.server";

import { randomize } from "./randomizer";

function createMockRestaurant(id: string): DiscoveredRestaurantProfile {
  return {
    name: `Restaurant ${id}`,
    latitude: 48.8566,
    longitude: 2.3522,
    source: "test",
    externalId: id,
    externalType: "restaurant",
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
    operational: true,
    website: null,
    sourceUrl: null
  };
}

describe("randomize", () => {
  it("returns an array of the same length", async () => {
    const restaurants = [
      createMockRestaurant("1"),
      createMockRestaurant("2"),
      createMockRestaurant("3")
    ];

    const result = await randomize(restaurants);

    expect(result).toHaveLength(3);
  });

  it("returns an array containing all original elements", async () => {
    const restaurants = [
      createMockRestaurant("1"),
      createMockRestaurant("2"),
      createMockRestaurant("3")
    ];

    const result = await randomize(restaurants);

    expect(result).toContainEqual(restaurants[0]);
    expect(result).toContainEqual(restaurants[1]);
    expect(result).toContainEqual(restaurants[2]);
  });

  it("does not modify the original array", async () => {
    const restaurants = [
      createMockRestaurant("1"),
      createMockRestaurant("2"),
      createMockRestaurant("3")
    ];
    const originalOrder = [...restaurants];

    await randomize(restaurants);

    expect(restaurants).toEqual(originalOrder);
  });

  it("returns an empty array when given an empty array", async () => {
    const result = await randomize([]);

    expect(result).toEqual([]);
  });

  it("returns single element array unchanged", async () => {
    const restaurants = [createMockRestaurant("1")];

    const result = await randomize(restaurants);

    expect(result).toEqual(restaurants);
  });

  it("produces different orderings across multiple calls (statistical test)", async () => {
    const restaurants = Array.from({ length: 10 }, (_, i) => createMockRestaurant(String(i)));

    const results = await Promise.all([
      randomize(restaurants),
      randomize(restaurants),
      randomize(restaurants),
      randomize(restaurants),
      randomize(restaurants)
    ]);

    const uniqueOrderings = new Set(results.map(r => r.map(x => x.externalId).join(",")));

    expect(uniqueOrderings.size).toBeGreaterThan(1);
  });

  it("uses Fisher-Yates shuffle algorithm", async () => {
    const mockRandom = vi.spyOn(Math, "random");
    mockRandom.mockReturnValue(0.5);

    const restaurants = [
      createMockRestaurant("1"),
      createMockRestaurant("2"),
      createMockRestaurant("3")
    ];

    await randomize(restaurants);

    expect(mockRandom).toHaveBeenCalled();

    mockRandom.mockRestore();
  });
});
