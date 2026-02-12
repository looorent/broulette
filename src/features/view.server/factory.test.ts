import { describe, expect, it } from "vitest";

import type { CandidateAndRestaurantAndProfileAndSearch, RestaurantAndProfiles, RestaurantProfile, Search } from "@persistence";

import { buildViewModelOfCandidate, buildViewModelOfRestaurant, buildViewModelOfSearch } from "./factory";

function createMockProfile(source: string, overrides: Partial<RestaurantProfile> = {}): RestaurantProfile {
  return {
    id: `profile-${source}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    restaurantId: "restaurant-1",
    source,
    externalId: `ext-${source}`,
    externalType: "restaurant",
    version: 1,
    latitude: 48.8566,
    longitude: 2.3522,
    name: `Restaurant from ${source}`,
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
    sourceUrl: null,
    ...overrides
  };
}

function createMockSearch(): Search {
  return {
    id: "search-1",
    createdAt: new Date(),
    latitude: 48.8566,
    longitude: 2.3522,
    serviceDate: new Date(2024, 2, 15),
    serviceInstant: new Date(2024, 2, 15, 12, 30),
    serviceEnd: new Date(2024, 2, 15, 14, 30),
    serviceTimeslot: "Lunch",
    distanceRange: "MidRange",
    exhausted: false,
    avoidFastFood: true,
    avoidTakeaway: true,
    minimumRating: 0
  };
}

function createMockRestaurant(profiles: RestaurantProfile[] = []): RestaurantAndProfiles {
  return {
    id: "restaurant-1",
    createdAt: new Date(),
    name: "Test Restaurant",
    latitude: 48.8566,
    longitude: 2.3522,
    profiles
  };
}

describe("buildViewModelOfRestaurant", () => {
  it("returns undefined for null restaurant", () => {
    const result = buildViewModelOfRestaurant(null, createMockSearch(), "en-US");
    expect(result).toBeUndefined();
  });

  it("returns undefined for undefined restaurant", () => {
    const result = buildViewModelOfRestaurant(undefined, createMockSearch(), "en-US");
    expect(result).toBeUndefined();
  });

  it("returns restaurant view with basic properties", () => {
    const restaurant = createMockRestaurant();
    const result = buildViewModelOfRestaurant(restaurant, createMockSearch(), "en-US");

    expect(result).toBeDefined();
    expect(result!.id).toBe("restaurant-1");
    expect(result!.name).toBe("Test Restaurant");
  });

  it("prioritizes Google profile data over others", () => {
    const profiles = [
      createMockProfile("osm", { description: "Overpass desc", imageUrl: "overpass.jpg" }),
      createMockProfile("tripadvisor", { description: "TripAdvisor desc", imageUrl: "tripadvisor.jpg" }),
      createMockProfile("google_place", { description: "Google desc", imageUrl: "google.jpg" })
    ];
    const restaurant = createMockRestaurant(profiles);

    const result = buildViewModelOfRestaurant(restaurant, createMockSearch(), "en-US");

    expect(result!.description).toBe("TripAdvisor desc");
    expect(result!.imageUrl).toBe("google.jpg");
    expect(result!.source).toBe("google_place");
  });

  it("falls back to TripAdvisor when Google data is missing", () => {
    const profiles = [
      createMockProfile("osm", { imageUrl: "overpass.jpg" }),
      createMockProfile("tripadvisor", { imageUrl: "tripadvisor.jpg" })
    ];
    const restaurant = createMockRestaurant(profiles);

    const result = buildViewModelOfRestaurant(restaurant, createMockSearch(), "en-US");

    expect(result!.imageUrl).toBe("tripadvisor.jpg");
  });

  it("falls back to Overpass when other sources are missing", () => {
    const profiles = [
      createMockProfile("osm", { imageUrl: "overpass.jpg", description: "Overpass description" })
    ];
    const restaurant = createMockRestaurant(profiles);

    const result = buildViewModelOfRestaurant(restaurant, createMockSearch(), "en-US");

    expect(result!.imageUrl).toBe("overpass.jpg");
    expect(result!.description).toBe("Overpass description");
  });

  it("computes weighted average rating from multiple profiles", () => {
    const profiles = [
      createMockProfile("google_place", { rating: 4.5, ratingCount: 100 }),
      createMockProfile("tripadvisor", { rating: 4.0, ratingCount: 50 })
    ];
    const restaurant = createMockRestaurant(profiles);

    const result = buildViewModelOfRestaurant(restaurant, createMockSearch(), "en-US");

    expect(result!.rating).toBeDefined();
    expect(result!.rating!.score).toBeCloseTo(4.33, 1);
  });

  it("returns undefined rating when no profiles have ratings", () => {
    const profiles = [
      createMockProfile("google_place"),
      createMockProfile("tripadvisor")
    ];
    const restaurant = createMockRestaurant(profiles);

    const result = buildViewModelOfRestaurant(restaurant, createMockSearch(), "en-US");

    expect(result!.rating).toBeUndefined();
  });

  it("uses first rating when no counts are available", () => {
    const profiles = [
      createMockProfile("google_place", { rating: 4.5, ratingCount: 0 }),
      createMockProfile("tripadvisor", { rating: 4.0, ratingCount: 0 })
    ];
    const restaurant = createMockRestaurant(profiles);

    const result = buildViewModelOfRestaurant(restaurant, createMockSearch(), "en-US");

    expect(result!.rating).toBeDefined();
    expect(result!.rating!.score).toBe(4.5);
  });

  it("builds correct map URL from coordinates", () => {
    const restaurant = createMockRestaurant();

    const result = buildViewModelOfRestaurant(restaurant, createMockSearch(), "en-US");

    expect(result!.mapUrl).toContain("google.com/maps");
    expect(result!.mapUrl).toContain("48.8566");
    expect(result!.mapUrl).toContain("2.3522");
  });

  it("uses profile mapUrl when available", () => {
    const profiles = [
      createMockProfile("google_place", { mapUrl: "https://goo.gl/maps/custom" })
    ];
    const restaurant = createMockRestaurant(profiles);

    const result = buildViewModelOfRestaurant(restaurant, createMockSearch(), "en-US");

    expect(result!.mapUrl).toBe("https://goo.gl/maps/custom");
  });

  it("builds URLs array from profiles", () => {
    const profiles = [
      createMockProfile("tripadvisor", { sourceUrl: "https://tripadvisor.com/restaurant", website: "https://restaurant.com" })
    ];
    const restaurant = createMockRestaurant(profiles);

    const result = buildViewModelOfRestaurant(restaurant, createMockSearch(), "en-US");

    expect(result!.urls).toContain("https://tripadvisor.com/restaurant");
    expect(result!.urls).toContain("https://restaurant.com");
  });

  it("deduplicates URLs by domain brand", () => {
    const profiles = [
      createMockProfile("tripadvisor", {
        sourceUrl: "https://www.tripadvisor.com/restaurant1",
        website: "https://www.tripadvisor.com/restaurant2"
      })
    ];
    const restaurant = createMockRestaurant(profiles);

    const result = buildViewModelOfRestaurant(restaurant, createMockSearch(), "en-US");

    expect(result!.urls.filter(u => u.includes("tripadvisor"))).toHaveLength(1);
  });
});

describe("buildViewModelOfSearch", () => {
  it("returns undefined for undefined search", () => {
    const result = buildViewModelOfSearch(undefined, "en-US");
    expect(result).toBeUndefined();
  });

  it("returns redirect when latestCandidateId exists", () => {
    const search = {
      searchId: "search-1",
      exhausted: false,
      serviceTimeslot: "Lunch" as const,
      serviceInstant: new Date(2024, 2, 15, 12, 30),
      distanceRange: "MidRange" as const,
      latestCandidateId: "candidate-1"
    };

    const result = buildViewModelOfSearch(search, "en-US");

    expect(result).toBeDefined();
    expect(result!.redirectRequired).toBe(true);
    if (result!.redirectRequired) {
      expect(result!.latestCandidateId).toBe("candidate-1");
      expect(result!.searchId).toBe("search-1");
    }
  });

  it("returns search view when no latestCandidateId", () => {
    const search = {
      searchId: "search-1",
      exhausted: false,
      serviceTimeslot: "Lunch" as const,
      serviceInstant: new Date(2024, 2, 15, 12, 30),
      distanceRange: "MidRange" as const,
      latestCandidateId: undefined
    };

    const result = buildViewModelOfSearch(search, "en-US");

    expect(result).toBeDefined();
    expect(result!.redirectRequired).toBe(false);
    if (!result!.redirectRequired) {
      expect(result!.id).toBe("search-1");
      expect(result!.label).toContain("Lunch");
      expect(result!.label).toContain("Drive");
    }
  });

  it("formats RightNow service time correctly", () => {
    const search = {
      searchId: "search-1",
      exhausted: false,
      serviceTimeslot: "RightNow" as const,
      serviceInstant: new Date(2024, 2, 15, 14, 30),
      distanceRange: "Close" as const,
      latestCandidateId: undefined
    };

    const result = buildViewModelOfSearch(search, "en-US");

    expect(result).toBeDefined();
    expect(result!.redirectRequired).toBe(false);
    if (!result!.redirectRequired) {
      expect(result!.label).toContain("By foot");
    }
  });
});

describe("buildViewModelOfCandidate", () => {
  function createMockCandidate(): CandidateAndRestaurantAndProfileAndSearch {
    return {
      id: "candidate-1",
      createdAt: new Date(),
      searchId: "search-1",
      restaurantId: "restaurant-1",
      recoveredFromCandidateId: null,
      order: 1,
      status: "Returned",
      rejectionReason: null,
      search: createMockSearch(),
      restaurant: createMockRestaurant([
        createMockProfile("google_place", {
          imageUrl: "https://example.com/image.jpg",
          openingHours: "Mo-Su 10:00-22:00"
        })
      ])
    };
  }

  it("returns undefined for null candidate", () => {
    const result = buildViewModelOfCandidate(null, "en-US", new Date());
    expect(result).toBeUndefined();
  });

  it("returns undefined for undefined candidate", () => {
    const result = buildViewModelOfCandidate(undefined, "en-US", new Date());
    expect(result).toBeUndefined();
  });

  it("returns candidate view with basic properties", () => {
    const candidate = createMockCandidate();
    const now = new Date(2024, 2, 15, 12, 0);

    const result = buildViewModelOfCandidate(candidate, "en-US", now);

    expect(result).toBeDefined();
    expect(result!.redirectRequired).toBe(false);
    if (!result!.redirectRequired) {
      expect(result!.candidate.id).toBe("candidate-1");
      expect(result!.search.id).toBe("search-1");
    }
  });

  it("sets rejected to true when status is Rejected", () => {
    const candidate = { ...createMockCandidate(), status: "Rejected" as const };
    const now = new Date(2024, 2, 15, 12, 0);

    const result = buildViewModelOfCandidate(candidate, "en-US", now);

    expect(result!.redirectRequired).toBe(false);
    if (!result!.redirectRequired) {
      expect(result!.candidate.rejected).toBe(true);
    }
  });

  it("enables reRoll when search is not exhausted and not expired", () => {
    const candidate = createMockCandidate();
    const now = new Date(2024, 2, 15, 12, 0);

    const result = buildViewModelOfCandidate(candidate, "en-US", now);

    expect(result!.redirectRequired).toBe(false);
    if (!result!.redirectRequired) {
      expect(result!.reRollEnabled).toBe(true);
    }
  });

  it("disables reRoll when search is exhausted", () => {
    const candidate = createMockCandidate();
    candidate.search.exhausted = true;
    const now = new Date(2024, 2, 15, 12, 0);

    const result = buildViewModelOfCandidate(candidate, "en-US", now);

    expect(result!.redirectRequired).toBe(false);
    if (!result!.redirectRequired) {
      expect(result!.reRollEnabled).toBe(false);
    }
  });

  it("disables reRoll when service has expired", () => {
    const candidate = createMockCandidate();
    const expiredTime = new Date(2024, 2, 15, 15, 0);

    const result = buildViewModelOfCandidate(candidate, "en-US", expiredTime);

    expect(result!.redirectRequired).toBe(false);
    if (!result!.redirectRequired) {
      expect(result!.reRollEnabled).toBe(false);
    }
  });

  it("includes restaurant view in result", () => {
    const candidate = createMockCandidate();
    const now = new Date(2024, 2, 15, 12, 0);

    const result = buildViewModelOfCandidate(candidate, "en-US", now);

    expect(result!.redirectRequired).toBe(false);
    if (!result!.redirectRequired) {
      expect(result!.restaurant).toBeDefined();
      expect(result!.restaurant!.id).toBe("restaurant-1");
    }
  });

  it("formats label with restaurant name", () => {
    const candidate = createMockCandidate();
    const now = new Date(2024, 2, 15, 12, 0);

    const result = buildViewModelOfCandidate(candidate, "en-US", now);

    expect(result!.redirectRequired).toBe(false);
    if (!result!.redirectRequired) {
      expect(result!.label).toContain("Test Restaurant");
    }
  });
});
