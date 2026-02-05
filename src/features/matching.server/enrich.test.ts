import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DiscoveredRestaurantProfile } from "@features/discovery.server";
import type { RestaurantAndProfiles, RestaurantProfile } from "@persistence";


import { enrichRestaurant } from "./enrich";
import { registeredMatchers } from "./matchers/registry";
import type { Matcher, Matching } from "./matchers/types";


vi.mock("@features/tag.server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/tag.server")>();
  return {
    ...actual,
    filterTags: vi.fn((tags: string[]) => tags)
  };
});

vi.mock("./matchers/registry", () => ({
  registeredMatchers: vi.fn(() => [])
}));

function createDiscoveredProfile(overrides: Partial<DiscoveredRestaurantProfile> = {}): DiscoveredRestaurantProfile {
  return {
    source: "osm",
    externalId: "123",
    externalType: "node",
    name: "Discovered Restaurant",
    latitude: 48.8566,
    longitude: 2.3522,
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

function createMockMatcher(source: string, overrides: Partial<Matcher> = {}): Matcher {
  return {
    source,
    matchAndEnrich: vi.fn(async (restaurant): Promise<Matching> => ({
      restaurant,
      matched: false
    })),
    hasReachedQuota: vi.fn(async () => false),
    ...overrides
  };
}

function createMockRestaurantRepository() {
  return {
    findRestaurantWithExternalIdentity: vi.fn(async () => null as RestaurantAndProfiles | null),
    createRestaurantFromDiscovery: vi.fn(async () => createMockRestaurant() as RestaurantAndProfiles)
  };
}

function createMockMatchingRepository() {
  return {
    doesAttemptExistSince: vi.fn(async () => false)
  };
}

describe("enrichRestaurant", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(registeredMatchers).mockReturnValue([]);
  });

  describe("when discovered is undefined", () => {
    it("returns undefined", async () => {
      const result = await enrichRestaurant(
        undefined,
        "en",
        createMockRestaurantRepository() as never,
        createMockMatchingRepository() as never
      );

      expect(result).toBeUndefined();
    });
  });

  describe("when discovered restaurant exists", () => {
    it("finds existing restaurant and returns enriched result", async () => {
      const existingRestaurant = createMockRestaurant([
        createMockProfile("osm")
      ]);
      const restaurantRepo = createMockRestaurantRepository();
      restaurantRepo.findRestaurantWithExternalIdentity.mockResolvedValue(existingRestaurant);

      const discovered = createDiscoveredProfile({ tags: ["italian"] });

      const result = await enrichRestaurant(
        discovered,
        "en",
        restaurantRepo as never,
        createMockMatchingRepository() as never
      );

      expect(restaurantRepo.findRestaurantWithExternalIdentity).toHaveBeenCalledWith("123", "node", "osm");
      expect(restaurantRepo.createRestaurantFromDiscovery).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("creates new restaurant when not found", async () => {
      const newRestaurant = createMockRestaurant();
      const restaurantRepo = createMockRestaurantRepository();
      restaurantRepo.createRestaurantFromDiscovery.mockResolvedValue(newRestaurant);

      const discovered = createDiscoveredProfile({
        externalId: "456",
        externalType: "way",
        name: "New Restaurant",
        latitude: 50.85,
        longitude: 4.35,
        tags: ["pizza"]
      });

      const result = await enrichRestaurant(
        discovered,
        "en",
        restaurantRepo as never,
        createMockMatchingRepository() as never
      );

      expect(restaurantRepo.findRestaurantWithExternalIdentity).toHaveBeenCalled();
      expect(restaurantRepo.createRestaurantFromDiscovery).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe("signal handling", () => {
    it("throws when signal is already aborted", async () => {
      const controller = new AbortController();
      controller.abort("Request cancelled");

      const existingRestaurant = createMockRestaurant();
      const restaurantRepo = createMockRestaurantRepository();
      restaurantRepo.findRestaurantWithExternalIdentity.mockResolvedValue(existingRestaurant);

      const discovered = createDiscoveredProfile({ name: "Test" });

      await expect(
        enrichRestaurant(
          discovered,
          "en",
          restaurantRepo as never,
          createMockMatchingRepository() as never,
          undefined,
          undefined,
          undefined,
          controller.signal
        )
      ).rejects.toBe("Request cancelled");
    });
  });
});

describe("shouldBeMatched (via enrichRestaurant)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("runs matcher when no profile exists for that source", async () => {
    const matcher = createMockMatcher("google_place");
    vi.mocked(registeredMatchers).mockReturnValue([matcher]);

    const existingRestaurant = createMockRestaurant([
      createMockProfile("osm") // only osm profile, no google
    ]);
    const restaurantRepo = createMockRestaurantRepository();
    restaurantRepo.findRestaurantWithExternalIdentity.mockResolvedValue(existingRestaurant);

    const discovered = createDiscoveredProfile({ name: "Test" });

    await enrichRestaurant(
      discovered,
      "en",
      restaurantRepo as never,
      createMockMatchingRepository() as never
    );

    expect(matcher.matchAndEnrich).toHaveBeenCalled();
  });

  it("runs matcher when profile is older than 60 days", async () => {
    const matcher = createMockMatcher("google_place");
    vi.mocked(registeredMatchers).mockReturnValue([matcher]);

    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 90);

    const existingRestaurant = createMockRestaurant([
      createMockProfile("google_place", { updatedAt: oldDate })
    ]);
    const restaurantRepo = createMockRestaurantRepository();
    restaurantRepo.findRestaurantWithExternalIdentity.mockResolvedValue(existingRestaurant);

    const discovered = createDiscoveredProfile({ name: "Test" });

    await enrichRestaurant(
      discovered,
      "en",
      restaurantRepo as never,
      createMockMatchingRepository() as never
    );

    expect(matcher.matchAndEnrich).toHaveBeenCalled();
  });

  it("skips matcher when profile is recent (less than 60 days)", async () => {
    const matcher = createMockMatcher("google_place");
    vi.mocked(registeredMatchers).mockReturnValue([matcher]);

    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 30);

    const existingRestaurant = createMockRestaurant([
      createMockProfile("google_place", { updatedAt: recentDate })
    ]);
    const restaurantRepo = createMockRestaurantRepository();
    restaurantRepo.findRestaurantWithExternalIdentity.mockResolvedValue(existingRestaurant);


    const discovered = createDiscoveredProfile({ name: "Test" });

    await enrichRestaurant(
      discovered,
      "en",
      restaurantRepo as never,
      createMockMatchingRepository() as never
    );

    expect(matcher.matchAndEnrich).not.toHaveBeenCalled();
  });

  it("skips matcher when quota is reached", async () => {
    const matcher = createMockMatcher("google_place", {
      hasReachedQuota: vi.fn(async () => true)
    });
    vi.mocked(registeredMatchers).mockReturnValue([matcher]);

    const existingRestaurant = createMockRestaurant([]);
    const restaurantRepo = createMockRestaurantRepository();
    restaurantRepo.findRestaurantWithExternalIdentity.mockResolvedValue(existingRestaurant);


    const discovered = createDiscoveredProfile({ name: "Test" });

    await enrichRestaurant(
      discovered,
      "en",
      restaurantRepo as never,
      createMockMatchingRepository() as never
    );

    expect(matcher.matchAndEnrich).not.toHaveBeenCalled();
  });

  it("skips matcher when recent attempt exists", async () => {
    const matcher = createMockMatcher("google_place");
    vi.mocked(registeredMatchers).mockReturnValue([matcher]);

    const matchingRepo = createMockMatchingRepository();
    matchingRepo.doesAttemptExistSince.mockResolvedValue(true);

    const existingRestaurant = createMockRestaurant([]);
    const restaurantRepo = createMockRestaurantRepository();
    restaurantRepo.findRestaurantWithExternalIdentity.mockResolvedValue(existingRestaurant);


    const discovered = createDiscoveredProfile({ name: "Test" });

    await enrichRestaurant(
      discovered,
      "en",
      restaurantRepo as never,
      matchingRepo as never
    );

    expect(matcher.matchAndEnrich).not.toHaveBeenCalled();
  });

  it("evaluates multiple matchers independently", async () => {
    const googleMatcher = createMockMatcher("google_place");
    const tripAdvisorMatcher = createMockMatcher("tripadvisor", {
      hasReachedQuota: vi.fn(async () => true) // quota reached
    });
    vi.mocked(registeredMatchers).mockReturnValue([googleMatcher, tripAdvisorMatcher]);

    const existingRestaurant = createMockRestaurant([]);
    const restaurantRepo = createMockRestaurantRepository();
    restaurantRepo.findRestaurantWithExternalIdentity.mockResolvedValue(existingRestaurant);


    const discovered = createDiscoveredProfile({ name: "Test" });

    await enrichRestaurant(
      discovered,
      "en",
      restaurantRepo as never,
      createMockMatchingRepository() as never
    );

    expect(googleMatcher.matchAndEnrich).toHaveBeenCalled();
    expect(tripAdvisorMatcher.matchAndEnrich).not.toHaveBeenCalled();
  });
});

describe("completeRestaurantFromProfiles (via enrichRestaurant)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(registeredMatchers).mockReturnValue([]);
  });

  it("prioritizes Google profile data over others", async () => {
    const existingRestaurant = createMockRestaurant([
      createMockProfile("osm", { name: "Overpass Name", latitude: 1.0, longitude: 1.0 }),
      createMockProfile("tripadvisor", { name: "TripAdvisor Name", latitude: 2.0, longitude: 2.0 }),
      createMockProfile("google_place", { name: "Google Name", latitude: 3.0, longitude: 3.0 })
    ]);
    const restaurantRepo = createMockRestaurantRepository();
    restaurantRepo.findRestaurantWithExternalIdentity.mockResolvedValue(existingRestaurant);

    const discovered = createDiscoveredProfile({ name: "Discovered" });

    const result = await enrichRestaurant(
      discovered,
      "en",
      restaurantRepo as never,
      createMockMatchingRepository() as never
    );

    expect(result?.name).toBe("Google Name");
    expect(result?.latitude).toBe(3.0);
    expect(result?.longitude).toBe(3.0);
  });

  it("falls back to TripAdvisor when Google is not available", async () => {
    const existingRestaurant = createMockRestaurant([
      createMockProfile("osm", { name: "Overpass Name", latitude: 1.0, longitude: 1.0 }),
      createMockProfile("tripadvisor", { name: "TripAdvisor Name", latitude: 2.0, longitude: 2.0 })
    ]);
    const restaurantRepo = createMockRestaurantRepository();
    restaurantRepo.findRestaurantWithExternalIdentity.mockResolvedValue(existingRestaurant);

    const discovered = createDiscoveredProfile({ name: "Discovered" });

    const result = await enrichRestaurant(
      discovered,
      "en",
      restaurantRepo as never,
      createMockMatchingRepository() as never
    );

    expect(result?.name).toBe("TripAdvisor Name");
    expect(result?.latitude).toBe(2.0);
    expect(result?.longitude).toBe(2.0);
  });

  it("falls back to Overpass when neither Google nor TripAdvisor is available", async () => {
    const existingRestaurant = createMockRestaurant([
      createMockProfile("osm", { name: "Overpass Name", latitude: 1.0, longitude: 1.0 })
    ]);
    const restaurantRepo = createMockRestaurantRepository();
    restaurantRepo.findRestaurantWithExternalIdentity.mockResolvedValue(existingRestaurant);

    const discovered = createDiscoveredProfile({ name: "Discovered" });

    const result = await enrichRestaurant(
      discovered,
      "en",
      restaurantRepo as never,
      createMockMatchingRepository() as never
    );

    expect(result?.name).toBe("Overpass Name");
    expect(result?.latitude).toBe(1.0);
    expect(result?.longitude).toBe(1.0);
  });

  it("falls back to restaurant's own values when no profiles exist", async () => {
    const existingRestaurant = createMockRestaurant([]);
    const restaurantRepo = createMockRestaurantRepository();
    restaurantRepo.findRestaurantWithExternalIdentity.mockResolvedValue(existingRestaurant);

    const discovered = createDiscoveredProfile({ name: "Discovered" });

    const result = await enrichRestaurant(
      discovered,
      "en",
      restaurantRepo as never,
      createMockMatchingRepository() as never
    );

    expect(result?.name).toBe("Test Restaurant");
    expect(result?.latitude).toBe(48.8566);
    expect(result?.longitude).toBe(2.3522);
  });

  it("handles partial profile data with mixed priorities", async () => {
    const existingRestaurant = createMockRestaurant([
      createMockProfile("osm", { name: "Overpass Name", latitude: 1.0, longitude: 1.0 }),
      createMockProfile("google_place", { name: null, latitude: undefined, longitude: 3.0 })
    ]);
    const restaurantRepo = createMockRestaurantRepository();
    restaurantRepo.findRestaurantWithExternalIdentity.mockResolvedValue(existingRestaurant);

    const discovered = createDiscoveredProfile({ name: "Discovered" });

    const result = await enrichRestaurant(
      discovered,
      "en",
      restaurantRepo as never,
      createMockMatchingRepository() as never
    );

    // Google name is null, falls back to Overpass
    expect(result?.name).toBe("Overpass Name");
    // Google latitude is null, falls back to Overpass
    expect(result?.latitude).toBe(1.0);
    // Google longitude is 3.0, uses that
    expect(result?.longitude).toBe(3.0);
  });
});

describe("profile merging (via enrichRestaurant)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("merges new profiles from matchers with existing profiles", async () => {
    const newGoogleProfile = createMockProfile("google_place", {
      id: "new-google-profile",
      name: "Google Restaurant"
    });

    const googleMatcher = createMockMatcher("google_place", {
      matchAndEnrich: vi.fn(async (restaurant): Promise<Matching> => ({
        restaurant: { ...restaurant, profiles: [newGoogleProfile] },
        matched: true
      }))
    });
    vi.mocked(registeredMatchers).mockReturnValue([googleMatcher]);

    const existingOsmProfile = createMockProfile("osm", { id: "existing-osm" });
    const existingRestaurant = createMockRestaurant([existingOsmProfile]);
    const restaurantRepo = createMockRestaurantRepository();
    restaurantRepo.findRestaurantWithExternalIdentity.mockResolvedValue(existingRestaurant);

    const discovered = createDiscoveredProfile({ name: "Discovered" });

    const result = await enrichRestaurant(
      discovered,
      "en",
      restaurantRepo as never,
      createMockMatchingRepository() as never
    );

    expect(result?.profiles).toHaveLength(2);
    expect(result?.profiles.map(p => p.id)).toContain("existing-osm");
    expect(result?.profiles.map(p => p.id)).toContain("new-google-profile");
  });

  it("deduplicates profiles by id when merging", async () => {
    const existingProfile = createMockProfile("osm", { id: "shared-id" });
    const duplicateProfile = createMockProfile("osm", { id: "shared-id", name: "Updated Name" });

    const matcher = createMockMatcher("osm", {
      matchAndEnrich: vi.fn(async (restaurant): Promise<Matching> => ({
        restaurant: { ...restaurant, profiles: [duplicateProfile] },
        matched: true
      }))
    });
    vi.mocked(registeredMatchers).mockReturnValue([matcher]);

    const existingRestaurant = createMockRestaurant([existingProfile]);
    const restaurantRepo = createMockRestaurantRepository();
    restaurantRepo.findRestaurantWithExternalIdentity.mockResolvedValue(existingRestaurant);

    const matchingRepo = createMockMatchingRepository();
    // Force matcher to run by having no recent attempt
    matchingRepo.doesAttemptExistSince.mockResolvedValue(false);

    const discovered = createDiscoveredProfile({ name: "Discovered" });

    // Profile from source=osm is recent, so matcher won't run
    // Let's test with a matcher for a different source
    const googleMatcher = createMockMatcher("google_place", {
      matchAndEnrich: vi.fn(async (restaurant): Promise<Matching> => ({
        restaurant: { ...restaurant, profiles: [existingProfile] }, // return same profile
        matched: true
      }))
    });
    vi.mocked(registeredMatchers).mockReturnValue([googleMatcher]);

    const result = await enrichRestaurant(
      discovered,
      "en",
      restaurantRepo as never,
      matchingRepo as never
    );

    // Should have only one profile with id "shared-id"
    const profilesWithSharedId = result?.profiles.filter(p => p.id === "shared-id");
    expect(profilesWithSharedId).toHaveLength(1);
  });

  it("runs multiple eligible matchers and merges all results", async () => {
    const googleProfile = createMockProfile("google_place", { id: "google-profile" });
    const tripAdvisorProfile = createMockProfile("tripadvisor", { id: "tripadvisor-profile" });

    const googleMatcher = createMockMatcher("google_place", {
      matchAndEnrich: vi.fn(async (restaurant): Promise<Matching> => ({
        restaurant: { ...restaurant, profiles: [googleProfile] },
        matched: true
      }))
    });
    const tripAdvisorMatcher = createMockMatcher("tripadvisor", {
      matchAndEnrich: vi.fn(async (restaurant): Promise<Matching> => ({
        restaurant: { ...restaurant, profiles: [tripAdvisorProfile] },
        matched: true
      }))
    });
    vi.mocked(registeredMatchers).mockReturnValue([googleMatcher, tripAdvisorMatcher]);

    const existingRestaurant = createMockRestaurant([]);
    const restaurantRepo = createMockRestaurantRepository();
    restaurantRepo.findRestaurantWithExternalIdentity.mockResolvedValue(existingRestaurant);

    const discovered = createDiscoveredProfile({ name: "Discovered" });

    const result = await enrichRestaurant(
      discovered,
      "en",
      restaurantRepo as never,
      createMockMatchingRepository() as never
    );

    expect(result?.profiles).toHaveLength(2);
    expect(result?.profiles.map(p => p.id)).toContain("google-profile");
    expect(result?.profiles.map(p => p.id)).toContain("tripadvisor-profile");
  });
});
