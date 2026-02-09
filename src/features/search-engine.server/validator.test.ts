import { afterEach, describe, expect, it, vi } from "vitest";

import { buildViewModelOfRestaurant } from "@features/view.server/factory";
import type { RestaurantAndProfiles, Search } from "@persistence";

import { validateRestaurant } from "./validator";

vi.mock("@features/view.server/factory", () => ({
  buildViewModelOfRestaurant: vi.fn()
}));

const mockedBuildViewModel = vi.mocked(buildViewModelOfRestaurant);

afterEach(() => {
  vi.clearAllMocks();
});

function createMockSearch(): Search {
  return {
    id: "search-1",
    createdAt: new Date(),
    latitude: 48.8566,
    longitude: 2.3522,
    serviceDate: new Date(),
    serviceInstant: new Date(),
    serviceEnd: new Date(),
    serviceTimeslot: "Lunch",
    distanceRange: "MidRange",
    exhausted: false,
    avoidFastFood: true,
    avoidTakeaway: true
  };
}

function createMockRestaurant(overrides: Partial<RestaurantAndProfiles> = {}): RestaurantAndProfiles {
  return {
    id: "restaurant-1",
    createdAt: new Date(),
    name: "Test Restaurant",
    latitude: 48.8566,
    longitude: 2.3522,
    profiles: [],
    ...overrides
  };
}

describe("validateRestaurant", () => {
  it("returns failed with no_restaurant_found when restaurant is undefined", async () => {
    const result = await validateRestaurant(undefined, createMockSearch(), "en-US");

    expect(result.valid).toBe(false);
    expect(result.rejectionReason).toBe("no_restaurant_found");
  });

  it("returns failed with missing_coordinates when latitude is null", async () => {
    const restaurant = createMockRestaurant({ latitude: null as unknown as number });

    const result = await validateRestaurant(restaurant, createMockSearch(), "en-US");

    expect(result.valid).toBe(false);
    expect(result.rejectionReason).toBe("missing_coordinates");
  });

  it("returns failed with missing_coordinates when longitude is null", async () => {
    const restaurant = createMockRestaurant({ longitude: null as unknown as number });

    const result = await validateRestaurant(restaurant, createMockSearch(), "en-US");

    expect(result.valid).toBe(false);
    expect(result.rejectionReason).toBe("missing_coordinates");
  });

  it("returns failed with missing_coordinates when latitude is undefined", async () => {
    const restaurant = createMockRestaurant({ latitude: undefined as unknown as number });

    const result = await validateRestaurant(restaurant, createMockSearch(), "en-US");

    expect(result.valid).toBe(false);
    expect(result.rejectionReason).toBe("missing_coordinates");
  });

  it("returns failed with unknown_opening_hours when opening hours are unknown", async () => {
    mockedBuildViewModel.mockReturnValue({
      id: "restaurant-1",
      name: "Test Restaurant",
      description: undefined,
      priceRange: undefined,
      imageUrl: "https://example.com/image.jpg",
      source: "test",
      rating: undefined,
      tags: [],
      phoneNumber: undefined,
      internationalPhoneNumber: undefined,
      openingHoursOfTheDay: { unknown: true, open: undefined, dayLabel: "", hoursLabel: "Unknown" },
      address: undefined,
      urls: [],
      mapUrl: undefined
    });

    const restaurant = createMockRestaurant();
    const result = await validateRestaurant(restaurant, createMockSearch(), "en-US");

    expect(result.valid).toBe(false);
    expect(result.rejectionReason).toBe("unknown_opening_hours");
  });

  it("returns failed with closed when restaurant is closed", async () => {
    mockedBuildViewModel.mockReturnValue({
      id: "restaurant-1",
      name: "Test Restaurant",
      description: undefined,
      priceRange: undefined,
      imageUrl: "https://example.com/image.jpg",
      source: "test",
      rating: undefined,
      tags: [],
      phoneNumber: undefined,
      internationalPhoneNumber: undefined,
      openingHoursOfTheDay: { unknown: false, open: false, dayLabel: "Mon", hoursLabel: "Closed" },
      address: undefined,
      urls: [],
      mapUrl: undefined
    });

    const restaurant = createMockRestaurant();
    const result = await validateRestaurant(restaurant, createMockSearch(), "en-US");

    expect(result.valid).toBe(false);
    expect(result.rejectionReason).toBe("closed");
  });

  it("returns failed with no_image when restaurant has no image", async () => {
    mockedBuildViewModel.mockReturnValue({
      id: "restaurant-1",
      name: "Test Restaurant",
      description: undefined,
      priceRange: undefined,
      imageUrl: undefined,
      source: "test",
      rating: undefined,
      tags: [],
      phoneNumber: undefined,
      internationalPhoneNumber: undefined,
      openingHoursOfTheDay: { unknown: false, open: true, dayLabel: "Mon", hoursLabel: "12:00-22:00" },
      address: undefined,
      urls: [],
      mapUrl: undefined
    });

    const restaurant = createMockRestaurant();
    const result = await validateRestaurant(restaurant, createMockSearch(), "en-US");

    expect(result.valid).toBe(false);
    expect(result.rejectionReason).toBe("no_image");
  });

  it("returns failed with fast_food when avoidFastFood is true and restaurant has fast_food tag", async () => {
    mockedBuildViewModel.mockReturnValue({
      id: "restaurant-1",
      name: "Test Restaurant",
      description: undefined,
      priceRange: undefined,
      imageUrl: "https://example.com/image.jpg",
      source: "test",
      rating: undefined,
      tags: [{ id: "fast_food", label: "Fast Food" }],
      phoneNumber: undefined,
      internationalPhoneNumber: undefined,
      openingHoursOfTheDay: { unknown: false, open: true, dayLabel: "Mon", hoursLabel: "12:00-22:00" },
      address: undefined,
      urls: [],
      mapUrl: undefined
    });

    const restaurant = createMockRestaurant();
    const search = createMockSearch();
    const result = await validateRestaurant(restaurant, search, "en-US");

    expect(result.valid).toBe(false);
    expect(result.rejectionReason).toBe("fast_food");
  });

  it("returns valid when avoidFastFood is false even if restaurant has fast_food tag", async () => {
    mockedBuildViewModel.mockReturnValue({
      id: "restaurant-1",
      name: "Test Restaurant",
      description: undefined,
      priceRange: undefined,
      imageUrl: "https://example.com/image.jpg",
      source: "test",
      rating: undefined,
      tags: [{ id: "fast_food", label: "Fast Food" }],
      phoneNumber: undefined,
      internationalPhoneNumber: undefined,
      openingHoursOfTheDay: { unknown: false, open: true, dayLabel: "Mon", hoursLabel: "12:00-22:00" },
      address: undefined,
      urls: [],
      mapUrl: undefined
    });

    const restaurant = createMockRestaurant();
    const search = { ...createMockSearch(), avoidFastFood: false };
    const result = await validateRestaurant(restaurant, search, "en-US");

    expect(result.valid).toBe(true);
    expect(result.rejectionReason).toBeUndefined();
  });

  it("returns failed with takeaway when avoidTakeaway is true and restaurant has meal_takeaway tag", async () => {
    mockedBuildViewModel.mockReturnValue({
      id: "restaurant-1",
      name: "Test Restaurant",
      description: undefined,
      priceRange: undefined,
      imageUrl: "https://example.com/image.jpg",
      source: "test",
      rating: undefined,
      tags: [{ id: "meal_takeaway", label: "Takeaway" }],
      phoneNumber: undefined,
      internationalPhoneNumber: undefined,
      openingHoursOfTheDay: { unknown: false, open: true, dayLabel: "Mon", hoursLabel: "12:00-22:00" },
      address: undefined,
      urls: [],
      mapUrl: undefined
    });

    const restaurant = createMockRestaurant();
    const search = createMockSearch();
    const result = await validateRestaurant(restaurant, search, "en-US");

    expect(result.valid).toBe(false);
    expect(result.rejectionReason).toBe("takeaway");
  });

  it("returns failed with takeaway when avoidTakeaway is true and restaurant has meal_delivery tag", async () => {
    mockedBuildViewModel.mockReturnValue({
      id: "restaurant-1",
      name: "Test Restaurant",
      description: undefined,
      priceRange: undefined,
      imageUrl: "https://example.com/image.jpg",
      source: "test",
      rating: undefined,
      tags: [{ id: "meal_delivery", label: "Delivery" }],
      phoneNumber: undefined,
      internationalPhoneNumber: undefined,
      openingHoursOfTheDay: { unknown: false, open: true, dayLabel: "Mon", hoursLabel: "12:00-22:00" },
      address: undefined,
      urls: [],
      mapUrl: undefined
    });

    const restaurant = createMockRestaurant();
    const search = createMockSearch();
    const result = await validateRestaurant(restaurant, search, "en-US");

    expect(result.valid).toBe(false);
    expect(result.rejectionReason).toBe("takeaway");
  });

  it("returns valid when avoidTakeaway is false even if restaurant has meal_takeaway tag", async () => {
    mockedBuildViewModel.mockReturnValue({
      id: "restaurant-1",
      name: "Test Restaurant",
      description: undefined,
      priceRange: undefined,
      imageUrl: "https://example.com/image.jpg",
      source: "test",
      rating: undefined,
      tags: [{ id: "meal_takeaway", label: "Takeaway" }],
      phoneNumber: undefined,
      internationalPhoneNumber: undefined,
      openingHoursOfTheDay: { unknown: false, open: true, dayLabel: "Mon", hoursLabel: "12:00-22:00" },
      address: undefined,
      urls: [],
      mapUrl: undefined
    });

    const restaurant = createMockRestaurant();
    const search = { ...createMockSearch(), avoidTakeaway: false };
    const result = await validateRestaurant(restaurant, search, "en-US");

    expect(result.valid).toBe(true);
    expect(result.rejectionReason).toBeUndefined();
  });

  it("returns valid when restaurant passes all checks", async () => {
    mockedBuildViewModel.mockReturnValue({
      id: "restaurant-1",
      name: "Test Restaurant",
      description: "A nice place",
      priceRange: "$$",
      imageUrl: "https://example.com/image.jpg",
      source: "test",
      rating: { score: 4.5, numberOfVotes: 100, label: "4.5" },
      tags: [],
      phoneNumber: "+1234567890",
      internationalPhoneNumber: "+1 234 567 890",
      openingHoursOfTheDay: { unknown: false, open: true, dayLabel: "Mon", hoursLabel: "12:00-22:00" },
      address: "123 Main St",
      urls: ["https://example.com"],
      mapUrl: "https://maps.google.com"
    });

    const restaurant = createMockRestaurant();
    const result = await validateRestaurant(restaurant, createMockSearch(), "en-US");

    expect(result.valid).toBe(true);
    expect(result.rejectionReason).toBeUndefined();
  });

  it("validates coordinates before building view model", async () => {
    const restaurant = createMockRestaurant({ latitude: null as unknown as number });

    await validateRestaurant(restaurant, createMockSearch(), "en-US");

    expect(mockedBuildViewModel).not.toHaveBeenCalled();
  });
});
