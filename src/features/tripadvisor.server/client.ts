import { circuitBreaker } from "@features/circuit-breaker.server";
import type { ImageUploader } from "@features/image-storage.server";
import { logger } from "@features/utils/logger";

import { TripAdvisorAuthorizationError, TripAdvisorEmptyResponseError, TripAdvisorError, TripAdvisorHttpError, TripAdvisorServerError } from "./error";
import { convertTripAdvisorHoursToOpeningHours } from "./opening-hours";
import { findBestTripAdvisorMatch } from "./similarity";
import { DEFAULT_TRIPADVISOR_CONFIGURATION, TRIPADVISOR_DEFAULT_PHOTO_SIZE, TRIPADVISOR_PHOTO_SIZES, type AddressInfo, type LocalizedName, type LocationHours, type OperatingPeriod, type TerraAddress, type TerraLocation, type TerraNearbyLocation, type TerraNearbyResponse, type TerraPeriod, type TerraPhoto, type TerraProblemDetail, type TerraTranslation, type TripAdvisorConfiguration, type TripAdvisorLocation, type TripAdvisorLocationNearby, type TripAdvisorPhotoSize } from "./types";

const CIRCUIT_BREAKER_NAME = "tripadvisor";
const API_VERSION = "1";
const MAX_SEARCH_RADIUS_IN_KILOMETERS = 8;
const MAX_SEARCH_RESULTS = 20;
const PHOTO_CDN_URL = "https://media-cdn.tripadvisor.com/media";
const RESIZED_PHOTO_CDN_URL = "https://dynamic-media-cdn.tripadvisor.com/media";
const PHOTO_WIDTH_IN_PIXELS: Record<TripAdvisorPhotoSize, number | undefined> = {
  thumbnail: 50,
  small: 150,
  medium: 250,
  large: 550,
  original: undefined
};

/** Returns the location without photo: an existing profile keeps the photo it already has. */
export async function findTripAdvisorLocationByIdWithRetry(
  locationId: string,
  locale: string = "en-US",
  configuration: TripAdvisorConfiguration = DEFAULT_TRIPADVISOR_CONFIGURATION,
  signal?: AbortSignal | undefined
): Promise<TripAdvisorLocation | undefined> {
  logger.log("[TripAdvisor] findTripAdvisorLocationByIdWithRetry: Processing request for locationId='%s'", locationId);

  return await circuitBreaker(CIRCUIT_BREAKER_NAME, configuration.failover).execute(async combinedSignal => {
    if (combinedSignal?.aborted) {
      throw combinedSignal.reason;
    }
    return await findTripAdvisorLocationById(locationId, locale, configuration, combinedSignal);
  }, signal);
}

/** Finds the location best matching `name` around the coordinates, with its representative photo uploaded through `imageUploader`. */
export async function searchTripAdvisorLocationNearbyWithRetry(
  name: string,
  latitude: number,
  longitude: number,
  radiusInMeters: number,
  locale: string = "en-US",
  configuration: TripAdvisorConfiguration = DEFAULT_TRIPADVISOR_CONFIGURATION,
  imageUploader: ImageUploader,
  signal?: AbortSignal | undefined
): Promise<TripAdvisorLocation | undefined> {
  logger.log("[TripAdvisor] searchTripAdvisorLocationNearbyWithRetry: Searching for '%s' near [%f, %f]", name, latitude, longitude);

  const nearbyLocations = await circuitBreaker(CIRCUIT_BREAKER_NAME, configuration.failover).execute(async combinedSignal => {
    if (combinedSignal?.aborted) {
      throw combinedSignal.reason;
    }
    return await findTripAdvisorLocationsNearby(latitude, longitude, radiusInMeters, locale, configuration, combinedSignal);
  }, signal);

  logger.log("[TripAdvisor] searchTripAdvisorLocationNearby: Found %d candidates. Calculating best match for '%s'...", nearbyLocations.length, name);
  const bestMatch = findBestTripAdvisorMatch(name, nearbyLocations.map(toLocationNearby), configuration.similarity);
  const matched = nearbyLocations.find(nearby => nearby.location.id.toString() === bestMatch?.locationId);

  if (matched) {
    logger.log("[TripAdvisor] searchTripAdvisorLocationNearby: Match found (ID: %s).", matched.location.id);
    const location = parseLocation(matched.location);
    const photoUrl = buildPhotoUrl(matched.photo, configuration.photo);
    if (photoUrl) {
      location.photoId = await imageUploader(photoUrl);
    }
    return location;
  } else {
    logger.log("[TripAdvisor] searchTripAdvisorLocationNearby: No suitable match found for '%s'.", name);
    return undefined;
  }
}

export function parseTripAdvisorPhotoSize(value: string | undefined): TripAdvisorPhotoSize | undefined {
  if (value && value?.length > 0) {
    if ((TRIPADVISOR_PHOTO_SIZES as readonly string[]).includes(value)) {
      return value as TripAdvisorPhotoSize;
    } else {
      logger.warn("[TripAdvisor] Invalid photo size found in env: '%s'. Default to '%s'", value, TRIPADVISOR_DEFAULT_PHOTO_SIZE);
      return TRIPADVISOR_DEFAULT_PHOTO_SIZE;
    }
  } else {
    return undefined;
  }
}

async function findTripAdvisorLocationById(
  locationId: string,
  locale: string,
  configuration: TripAdvisorConfiguration,
  signal: AbortSignal
): Promise<TripAdvisorLocation | undefined> {
  const url = buildUrl(configuration, `/locations/${encodeURIComponent(locationId)}`, { locale });
  const body = await fetchTerra<TerraLocation>(url, configuration, signal);
  return body.id ? parseLocation(body) : undefined;
}

async function findTripAdvisorLocationsNearby(
  latitude: number,
  longitude: number,
  radiusInMeters: number,
  locale: string,
  configuration: TripAdvisorConfiguration,
  signal: AbortSignal
): Promise<TerraNearbyLocation[]> {
  const url = buildUrl(configuration, "/locations/nearby", {
    lat: latitude.toString(),
    lon: longitude.toString(),
    radius: Math.min(radiusInMeters / 1_000, MAX_SEARCH_RADIUS_IN_KILOMETERS).toString(),
    unit: "KM",
    category: "RESTAURANT",
    sort: "distance,asc",
    size: Math.min(Math.max(configuration.search.maxResults, 1), MAX_SEARCH_RESULTS).toString(),
    include_photo: "true",
    locale
  });
  const body = await fetchTerra<TerraNearbyResponse>(url, configuration, signal);
  return Array.isArray(body.data) ? body.data.filter(nearby => nearby?.location?.id) : [];
}

async function fetchTerra<T>(url: string, configuration: TripAdvisorConfiguration, signal: AbortSignal): Promise<T> {
  const start = Date.now();
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-API-Key": configuration.apiKey,
      "Accept": "application/json"
    },
    signal
  });
  const durationInMs = Date.now() - start;

  if (response.ok) {
    logger.log("[TripAdvisor] Request succeeded in %dms. URL: %s", durationInMs, url);
    const body = await response.json() as T | null;
    if (body) {
      return body;
    } else {
      throw new TripAdvisorEmptyResponseError(url, response.status, durationInMs);
    }
  } else {
    throw await parseError(url, response, durationInMs);
  }
}

function buildUrl(configuration: TripAdvisorConfiguration, path: string, parameters: Record<string, string>): string {
  const query = new URLSearchParams({ version: API_VERSION, ...parameters });
  return `${configuration.instanceUrl}${path}?${query.toString()}`;
}

function buildPhotoUrl(photo: TerraPhoto | undefined, size: TripAdvisorPhotoSize): string | undefined {
  const key = photo?.photo?.key;
  if (key) {
    const width = PHOTO_WIDTH_IN_PIXELS[size];
    return width ? `${RESIZED_PHOTO_CDN_URL}/${key}?w=${width}&h=-1&s=1` : `${PHOTO_CDN_URL}/${key}`;
  } else {
    return undefined;
  }
}

function toLocationNearby(nearby: TerraNearbyLocation): TripAdvisorLocationNearby {
  return {
    locationId: nearby.location.id.toString(),
    name: primaryTranslationOf(nearby.location.names) || "",
    distanceInMeters: (nearby.distance_kilometers ?? 0) * 1_000,
    bearing: nearby.bearing?.toString() ?? "",
    address: parseAddress(nearby.location.addresses?.[0])
  };
}

function parseLocation(body: TerraLocation): TripAdvisorLocation {
  const rating = body.traveler_ratings?.overall;
  return {
    id: body.id.toString(),
    name: primaryTranslationOf(body.names) || "",
    description: primaryTranslationOf(body.descriptions),
    latitude: body.coordinates?.latitude,
    longitude: body.coordinates?.longitude,
    address: parseAddress(body.addresses?.[0]),
    tripAdvisorUrl: body.urls?.tripadvisor?.main || undefined,
    website: body.urls?.official || undefined,
    phone: body.phone_numbers?.[0]?.value || undefined,
    rating: rating?.rating || undefined,
    numberOfReviews: rating?.count ?? 0,
    priceLevel: body.price_level || undefined,
    cuisine: parseCuisine(body.categories),
    openingHours: convertTripAdvisorHoursToOpeningHours(parseHours(body.opening_hours?.periods)),
    photoId: undefined
  };
}

function primaryTranslationOf(translations: TerraTranslation[] | undefined): string | undefined {
  return (translations?.find(translation => translation.primary) ?? translations?.[0])?.value || undefined;
}

function parseAddress(body: TerraAddress | undefined): AddressInfo | undefined {
  if (body) {
    const address: AddressInfo = {
      street1: body.street_address || undefined,
      street2: body.street_address2 || undefined,
      city: body.city || undefined,
      state: body.state || undefined,
      country: body.country_code || undefined,
      postalcode: body.postal_code || undefined,
      addressString: body.formatted || undefined
    };
    return Object.values(address).some(Boolean) ? address : undefined;
  } else {
    return undefined;
  }
}

function parseCuisine(categories: TerraLocation["categories"]): LocalizedName[] {
  return (categories ?? [])
    .filter(category => category.display_name)
    .map(category => ({ name: category.display_name!, localizedName: category.display_name! }));
}

const DAY_NUMBERS: Record<string, number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7
};

function parseHours(periods: TerraPeriod[] | undefined): LocationHours | undefined {
  if (Array.isArray(periods)) {
    return {
      periods: periods
        .filter(period => period.day_of_week && DAY_NUMBERS[period.day_of_week] && period.opens)
        .map((period): OperatingPeriod => {
          const day = DAY_NUMBERS[period.day_of_week!];
          return {
            open: { day, time: toCompactTime(period.opens!) },
            close: period.closes ? { day, time: toCompactTime(period.closes) } : undefined
          };
        })
    };
  } else {
    return undefined;
  }
}

function toCompactTime(time: string): string {
  return time.replace(":", "");
}

async function parseError(url: string, response: Response, durationInMs: number): Promise<TripAdvisorError> {
  const body = await response.json().catch(() => undefined) as TerraProblemDetail | undefined;

  logger.error("[TripAdvisor] Request failed after %dms. Status: %d. Reason: %s. URL: %s", durationInMs, response.status, body?.detail || body?.message || body?.title, url);

  if (response.status >= 500) {
    return new TripAdvisorServerError(url, response.status, body, durationInMs);
  } else if (response.status === 401) {
    return new TripAdvisorAuthorizationError(url, response.status, body, durationInMs);
  } else {
    // Includes 429: Terra asks not to retry right away, which would only extend the rate limit window.
    return new TripAdvisorHttpError(url, response.status, body, durationInMs);
  }
}
