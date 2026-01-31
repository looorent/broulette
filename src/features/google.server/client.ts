import { circuitBreaker } from "@features/circuit-breaker.server";
import { computeViewportFromCircle } from "@features/coordinate";
import { isAbortError } from "@features/utils/error";
import { logger } from "@features/utils/logger";

import { GoogleAuthorizationError, GoogleError, GoogleHttpError, GoogleServerError } from "./error";
import { convertBusinessStatusToOperational, formatPrices } from "./formatter";
import { convertGooglePeriodsToOpeningHours } from "./opening-hours";
import { compareSimilarity } from "./similarity";
import { DEFAULT_GOOGLE_PLACE_CONFIGURATION, type GooglePlace, type GooglePlaceConfiguration, type GoogleRestaurant } from "./types";

// pay attention to the fields we import, we currently do not require the "Enterprise + Atmosphere" SKU.
// https://developers.google.com/maps/documentation/places/web-service/data-fields
const FIELDS_TO_FETCH = [
  "id",
  "name",
  "displayName",
  "location",
  "formattedAddress",
  "addressComponents",
  "shortFormattedAddress",
  "types",
  "businessStatus",
  "googleMapsUri",
  "rating",
  "regularOpeningHours",
  "nationalPhoneNumber",
  "internationalPhoneNumber",
  "priceRange",
  "userRatingCount",
  "primaryType",
  "websiteUri",
  "photos"
];

const SEARCH_FIELDS_MASK = FIELDS_TO_FETCH.map(field => `places.${field}`).join(",");
const DETAIL_FIELDS_MASK = FIELDS_TO_FETCH.join(",");
const CIRCUIT_BREAKER_NAME = "google";

export async function findGoogleRestaurantById(
  placeId: string,
  configuration: GooglePlaceConfiguration = DEFAULT_GOOGLE_PLACE_CONFIGURATION,
  signal?: AbortSignal | undefined
): Promise<GoogleRestaurant | undefined> {
  logger.log("[Google Place] findGoogleRestaurantById: Processing request for placeId='%s'", placeId);

  const place = await circuitBreaker(CIRCUIT_BREAKER_NAME, configuration.failover).execute(async combinedSignal => {
    if (combinedSignal?.aborted) {
      throw combinedSignal.reason;
    }
    return await findPlaceById(placeId, configuration, combinedSignal);
  }, signal);

  if (place) {
    logger.log("[Google Place] findGoogleRestaurantById: Place found. Converting and fetching photos.");
    return addPhotoUriOn(convertGooglePlaceToRestaurant(place), configuration, signal);
  } else {
    logger.log("[Google Place] findGoogleRestaurantById: No place found for id='%s'", placeId);
    return undefined;
  }
}

async function findPlaceById(
  placeId: string,
  configuration: GooglePlaceConfiguration = DEFAULT_GOOGLE_PLACE_CONFIGURATION,
  signal?: AbortSignal
): Promise<GooglePlace> {
  logger.log("[Google Place] findPlaceById: Fetching details for id='%s'...", placeId);
  const start = Date.now();

  try {
    const response = await fetch(`${configuration.baseUrl}/places/${placeId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": configuration.apiKey,
        "X-Goog-FieldMask": DETAIL_FIELDS_MASK
      },
      signal
    });

    if (!response.ok) {
      throw await response.json();
    }

    const data = await response.json();
    logger.log("[Google Place] findPlaceById: Success. Duration: %dms", Date.now() - start);
    return data as GooglePlace;
  } catch (error: unknown) {
    if (isAbortError(error)) {
      throw error;
    }
    const duration = Date.now() - start;
    logger.error("[Google Place] findPlaceById: Failed after %dms. Error:", duration, error);
    throw parseError(error, `placeId='${placeId}'`, duration);
  }
}

export async function searchGoogleRestaurantByText(
  searchableText: string,
  latitude: number,
  longitude: number,
  configuration: GooglePlaceConfiguration = DEFAULT_GOOGLE_PLACE_CONFIGURATION,
  signal?: AbortSignal | undefined
): Promise<GoogleRestaurant | undefined> {
  logger.log("[Google Place] searchGoogleRestaurantByText: Searching for '%s' near [%f, %f]", searchableText, latitude, longitude);

  const comparable = { displayName: searchableText, latitude: latitude, longitude: longitude };

  const places = await findPlacesByText(
    searchableText,
    latitude,
    longitude,
    3,
    SEARCH_FIELDS_MASK,
    configuration,
    signal
  );

  const bestMatch = places
    .map(convertGooglePlaceToRestaurant)
    ?.filter(Boolean)
    ?.map((restaurant) => ({ restaurant: restaurant!, match: compareSimilarity(comparable, restaurant!, configuration.similarity) }))
    ?.sort((a, b) => b.match.totalScore - a.match.totalScore)
    ?.[0];

  if (bestMatch) {
    logger.log("[Google Place] searchGoogleRestaurantByText: Match found for '%s'", searchableText);
    return await addPhotoUriOn(bestMatch.restaurant, configuration, signal);
  } else {
    logger.log("[Google Place] searchGoogleRestaurantByText: No suitable match found for '%s'", searchableText);
    return bestMatch;
  }
}

async function findPlacesByText(
  searchableText: string,
  latitude: number,
  longitude: number,
  maximumNumberOfResultsToQuery: number,
  fieldMask: string,
  configuration: GooglePlaceConfiguration,
  signal?: AbortSignal
): Promise<GooglePlace[]> {
  logger.log("[Google Place] findPlacesByText: Querying API for '%s' near [%f,%f]...", searchableText, latitude, longitude);
  const start = Date.now();

  const viewport = computeViewportFromCircle({ latitude: latitude, longitude: longitude }, configuration.search.radiusInMeters);
  const body = {
    textQuery: searchableText,
    maxResultCount: maximumNumberOfResultsToQuery,
    rankPreference: "RELEVANCE",
    includedType: "restaurant",
    locationRestriction: {
      rectangle: {
        low: {
          latitude: viewport.bottomLeft.latitude,
          longitude: viewport.bottomLeft.longitude
        },
        high: {
          latitude: viewport.topRight.latitude,
          longitude: viewport.topRight.longitude
        }
      }
    }
  };

  try {
    const response = await fetch(`${configuration.baseUrl}/places:searchText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": configuration.apiKey,
        "X-Goog-FieldMask": fieldMask
      },
      body: JSON.stringify(body),
      signal
    });

    if (!response.ok) {
      throw await response.json();
    }

    const data = await response.json() as any;
    logger.log("[Google Place] findPlacesByText: Success. Found %d places. Duration: %dms", (data.places || []).length, Date.now() - start);
    return (data.places || []) as GooglePlace[];
  } catch (error: unknown) {
    if (isAbortError(error)) {
      throw error;
    }
    const duration = Date.now() - start;
    logger.error("[Google Place] findPlacesByText: Failed after %dms. Error:", duration, error);
    throw parseError(error, `near '${latitude},${longitude}' with text = '${searchableText}'`, duration);
  }
}

async function findGoogleImageUrl(
  photoId: string,
  apiKey: string,
  maxWidthPx: number,
  maxHeightPx: number,
  baseUrl: string,
  signal?: AbortSignal
): Promise<string | null | undefined> {
  logger.log("[Google Place] findGoogleImageUrl: Fetching photo URI for photoId='%s'...", photoId);
  const start = Date.now();

  const resourceName = photoId?.endsWith("/media") ? photoId : `${photoId}/media`;
  try {
    const response = await fetch(`${baseUrl}/${resourceName}?maxWidthPx=${maxWidthPx}&maxHeightPx=${maxHeightPx}&key=${apiKey}&skipHttpRedirect=true`, { signal });

    if (!response.ok) {
      throw await response.json();
    }

    const data = await response.json() as any;
    logger.log("[Google Place] findGoogleImageUrl: Success. Duration: %dms.", Date.now() - start);
    return data?.photoUri;
  } catch (e: any) {
    const duration = Date.now() - start;
    logger.error("[Google Place] findGoogleImageUrl: Failed after %dms. Error:", duration, e);
    throw parseError(e, `photoId='${photoId}'`, duration);
  }
}

function convertGooglePlaceToRestaurant(
  place: GooglePlace | undefined
): GoogleRestaurant | undefined {
  if (place && place.location) {
    const { priceLevel, priceLabel } = formatPrices(place);
    return {
      id: place.id!,
      displayName: place.displayName?.text,
      types: place.types || [],
      primaryType: place.primaryType,
      nationalPhoneNumber: place.nationalPhoneNumber,
      internationalPhoneNumber: place.internationalPhoneNumber,
      formattedAddress: place.formattedAddress,
      countryCode: place.addressComponents?.find(component => component?.types?.includes("country"))?.shortText?.toLowerCase(),
      shortFormattedAddress: place.shortFormattedAddress,
      latitude: place.location!.latitude!,
      longitude: place.location!.longitude!,
      rating: place.rating,
      userRatingCount: place.userRatingCount,
      googleMapsUri: place.googleMapsUri,
      websiteUri: place.websiteUri,
      openingHours: place.regularOpeningHours ? convertGooglePeriodsToOpeningHours(place.regularOpeningHours) : undefined,
      operational: convertBusinessStatusToOperational(place.businessStatus?.toString()),
      priceLevel: priceLevel,
      priceLabel: priceLabel,
      photoIds: place.photos?.map(photo => photo.name)?.filter(Boolean)?.map(id => id!) || [],
      photoUrl: undefined
    }
  } else {
    return undefined;
  }
}

async function addPhotoUriOn(
  restaurant: GoogleRestaurant | undefined,
  configuration: GooglePlaceConfiguration,
  signal?: AbortSignal | undefined
): Promise<GoogleRestaurant | undefined> {
  const photoId = restaurant?.photoIds?.[0];
  if (photoId) {
    const photoUrl = await circuitBreaker(CIRCUIT_BREAKER_NAME, configuration.failover).execute(async combinedSignal => {
      if (combinedSignal?.aborted) {
        throw combinedSignal.reason;
      }
      return findGoogleImageUrl(photoId, configuration.apiKey, configuration.photo.maxWidthInPx, configuration.photo.maxHeightInPx, configuration.baseUrl, combinedSignal);
    }, signal);

    if (photoUrl) {
      restaurant.photoUrl = photoUrl;
    }
    return restaurant;
  } else {
    return undefined;
  }
}

const GRPC_ERROR_CODES = [4, 14];
const AUTHORIZATION_ERROR_CODES = [3, 401, 403];

function parseError(e: any, query: string, durationInMs: number): GoogleError {
  // Handle native fetch error response (which might be an object with .error field or just status)
  const errorObj = e.error || e;
  const statusCode = errorObj.code || errorObj.status || 500;
  const responseBody = errorObj.message || errorObj.details || JSON.stringify(e) || "Unknown error";

  if (statusCode >= 500 || GRPC_ERROR_CODES.includes(statusCode)) {
    return new GoogleServerError(
      query,
      statusCode,
      responseBody,
      durationInMs
    );
  } else if (AUTHORIZATION_ERROR_CODES.includes(statusCode)) {
    return new GoogleAuthorizationError(
      query,
      statusCode,
      responseBody,
      durationInMs
    );
  } else {
    return new GoogleHttpError(
      query,
      statusCode,
      responseBody,
      durationInMs
    );
  }
}
