import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { findTripAdvisorLocationByIdWithRetry, searchTripAdvisorLocationNearbyWithRetry } from "./client";
import { TripAdvisorAuthorizationError, TripAdvisorHttpError } from "./error";
import { DEFAULT_TRIPADVISOR_CONFIGURATION, type TerraLocation, type TripAdvisorConfiguration } from "./types";

const configuration: TripAdvisorConfiguration = {
  ...DEFAULT_TRIPADVISOR_CONFIGURATION,
  enabled: true,
  apiKey: "test-api-key",
  search: { radiusInMeters: 1000, maxResults: 5 },
  similarity: { weight: { name: 0.7, location: 0.3 }, maxDistanceInMeters: 1000, minScoreThreshold: 0.5 },
  photo: "medium",
  failover: { retry: 2, timeoutInMs: 1000, halfOpenAfterInMs: 1000, consecutiveFailures: 100 }
};

// Shaped after real Terra responses (GET /locations/nearby and GET /locations/{id}, version 1).
const phatThai: TerraLocation = {
  id: 2555537,
  names: [{ language: "en", value: "Phat Thai", primary: true }],
  descriptions: [],
  addresses: [{
    street_address: "Rue des Carmes 46",
    city: "Namur",
    country_code: "BE",
    postal_code: "5000",
    formatted: "Rue des Carmes 46, Namur 5000 Belgium"
  }],
  coordinates: { latitude: 50.465667, longitude: 4.864864 },
  phone_numbers: [{ value: "+32 81 22 86 17", type: "phone" }],
  urls: {
    tripadvisor: { main: "https://www.tripadvisor.com/Restaurant_Review-g188663-d2555537-Reviews-Phat_Thai-Namur_Namur_Province.html" },
    official: "http://www.phatthai.be/"
  },
  traveler_ratings: { overall: { rating: 3.4, count: 142 } },
  price_level: "Mid Range"
};

const surfside: TerraLocation = {
  id: 21478317,
  names: [{ language: "en", value: "Surfside Poké - Namur", primary: true }],
  descriptions: [{ language: "en", value: "The Poke Bowl is a traditional Hawaiian dish." }],
  coordinates: { latitude: 50.4654, longitude: 4.8657 },
  opening_hours: {
    periods: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
      .map(day_of_week => ({ day_of_week, opens: "11:00", closes: "22:00" }))
  },
  price_level: "Cheap Eats"
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("TripAdvisor Terra client", () => {
  const fetchMock = vi.fn<typeof fetch>();
  const imageUploader = vi.fn(async () => "uploaded-photo-id");

  beforeEach(() => {
    fetchMock.mockReset();
    imageUploader.mockClear();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("searchTripAdvisorLocationNearbyWithRetry", () => {
    function nearbyResponse() {
      return jsonResponse({
        data: [
          { location: surfside, distance_kilometers: 0.03, bearing: 120 },
          {
            location: phatThai,
            distance_kilometers: 0.068,
            bearing: 319,
            photo: { photo: { key: "photo-o/11/5a/87/d3/c-est-propre-et-accueillant.jpg" } }
          }
        ],
        pagination: { page: 1, size: 5, total_pages: 21, total_elements: 102 }
      });
    }

    it("searches restaurants around the coordinates, nearest first, with the API key in a header", async () => {
      fetchMock.mockResolvedValue(nearbyResponse());

      await searchTripAdvisorLocationNearbyWithRetry("Phat Thai", 50.4652, 4.8655, 1000, "en-US", configuration, imageUploader);

      const [url, init] = fetchMock.mock.calls[0];
      const requested = new URL(url as string);
      expect(`${requested.origin}${requested.pathname}`).toBe("https://terra.tripadvisor.com/api/locations/nearby");
      expect(Object.fromEntries(requested.searchParams)).toEqual({
        version: "1",
        lat: "50.4652",
        lon: "4.8655",
        radius: "1",
        unit: "KM",
        category: "RESTAURANT",
        sort: "distance,asc",
        size: "5",
        include_photo: "true",
        locale: "en-US"
      });
      expect(new Headers(init?.headers).get("X-API-Key")).toBe("test-api-key");
      expect(url).not.toContain("test-api-key");
    });

    it("returns the best match parsed from the nearby search, without any other call", async () => {
      fetchMock.mockResolvedValue(nearbyResponse());

      const location = await searchTripAdvisorLocationNearbyWithRetry("Phat Thai", 50.4652, 4.8655, 1000, "en-US", configuration, imageUploader);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(location).toEqual({
        id: "2555537",
        name: "Phat Thai",
        description: undefined,
        latitude: 50.465667,
        longitude: 4.864864,
        address: {
          street1: "Rue des Carmes 46",
          street2: undefined,
          city: "Namur",
          state: undefined,
          country: "BE",
          postalcode: "5000",
          addressString: "Rue des Carmes 46, Namur 5000 Belgium"
        },
        tripAdvisorUrl: "https://www.tripadvisor.com/Restaurant_Review-g188663-d2555537-Reviews-Phat_Thai-Namur_Namur_Province.html",
        website: "http://www.phatthai.be/",
        phone: "+32 81 22 86 17",
        rating: 3.4,
        numberOfReviews: 142,
        priceLevel: "Mid Range",
        cuisine: [],
        openingHours: undefined,
        photoId: "uploaded-photo-id"
      });
    });

    it("uploads the representative photo resized to the configured size", async () => {
      fetchMock.mockResolvedValue(nearbyResponse());

      await searchTripAdvisorLocationNearbyWithRetry("Phat Thai", 50.4652, 4.8655, 1000, "en-US", configuration, imageUploader);

      expect(imageUploader).toHaveBeenCalledWith("https://dynamic-media-cdn.tripadvisor.com/media/photo-o/11/5a/87/d3/c-est-propre-et-accueillant.jpg?w=250&h=-1&s=1");
    });

    it("uploads the original photo when the original size is configured", async () => {
      fetchMock.mockResolvedValue(nearbyResponse());

      await searchTripAdvisorLocationNearbyWithRetry("Phat Thai", 50.4652, 4.8655, 1000, "en-US", { ...configuration, photo: "original" }, imageUploader);

      expect(imageUploader).toHaveBeenCalledWith("https://media-cdn.tripadvisor.com/media/photo-o/11/5a/87/d3/c-est-propre-et-accueillant.jpg");
    });

    it("returns nothing when no nearby location matches the name", async () => {
      fetchMock.mockResolvedValue(nearbyResponse());

      const location = await searchTripAdvisorLocationNearbyWithRetry("Le Chapitre", 50.4652, 4.8655, 1000, "en-US", configuration, imageUploader);

      expect(location).toBeUndefined();
      expect(imageUploader).not.toHaveBeenCalled();
    });

    it("keeps the radius and the number of results within the API limits", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ data: [] }));

      await searchTripAdvisorLocationNearbyWithRetry("Phat Thai", 50.4652, 4.8655, 20_000, "en-US", { ...configuration, search: { radiusInMeters: 20_000, maxResults: 50 } }, imageUploader);

      const requested = new URL(fetchMock.mock.calls[0][0] as string);
      expect(requested.searchParams.get("radius")).toBe("8");
      expect(requested.searchParams.get("size")).toBe("20");
    });
  });

  describe("findTripAdvisorLocationByIdWithRetry", () => {
    it("fetches the location details and converts its opening hours", async () => {
      fetchMock.mockResolvedValue(jsonResponse(surfside));

      const location = await findTripAdvisorLocationByIdWithRetry("21478317", "en-US", configuration);

      const requested = new URL(fetchMock.mock.calls[0][0] as string);
      expect(`${requested.pathname}?${requested.searchParams}`).toBe("/api/locations/21478317?version=1&locale=en-US");
      expect(location).toMatchObject({
        id: "21478317",
        name: "Surfside Poké - Namur",
        description: "The Poke Bowl is a traditional Hawaiian dish.",
        priceLevel: "Cheap Eats",
        openingHours: "Mo-Su 11:00-22:00",
        photoId: undefined
      });
    });

    it("rejects with an authorization error on 401", async () => {
      fetchMock.mockResolvedValue(jsonResponse({ status: 401, detail: "API key has not been found" }, 401));

      await expect(findTripAdvisorLocationByIdWithRetry("21478317", "en-US", configuration)).rejects.toBeInstanceOf(TripAdvisorAuthorizationError);
    });

    it("does not retry right away when rate limited", async () => {
      fetchMock.mockImplementation(async () => jsonResponse({ status: 429, title: "Too Many Requests" }, 429));

      await expect(findTripAdvisorLocationByIdWithRetry("21478317", "en-US", configuration)).rejects.toBeInstanceOf(TripAdvisorHttpError);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
