import { PlacesClient, type protos } from "@googlemaps/places";

import { computeViewportFromCircle } from "@features/coordinate";

import { googleCircuitBreaker } from "./circuit-breaker";
import { GoogleAuthorizationError, GoogleError, GoogleHttpError, GoogleServerError } from "./error";
import { convertBusinessStatusToOperational, formatPrices } from "./formatter";
import { convertGooglePeriodsToOpeningHours } from "./opening-hours";
import { compareSimilarity } from "./similarity";
import { DEFAULT_GOOGLE_PLACE_CONFIGURATION, type GooglePlaceConfiguration, type GoogleRestaurant } from "./types";

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

export async function findGoogleRestaurantById(
  placeId: string,
  configuration: GooglePlaceConfiguration = DEFAULT_GOOGLE_PLACE_CONFIGURATION,
  signal?: AbortSignal | undefined
): Promise<GoogleRestaurant | undefined> {
  const place = await googleCircuitBreaker().execute(async ({ signal: combinedSignal }) => {
    if (combinedSignal?.aborted) {
      throw combinedSignal.reason;
    }
    return await findPlaceById(placeId, configuration);
  }, signal);

  if (place) {
    return addPhotoUriOn(convertGooglePlaceToRestaurant(place), configuration, signal);
  } else {
    return undefined;
  }
}

async function findPlaceById(
  placeId: string,
  configuration: GooglePlaceConfiguration = DEFAULT_GOOGLE_PLACE_CONFIGURATION
): Promise<protos.google.maps.places.v1.IPlace> {
  console.info(`[Google Place] Finding the place with id='${placeId}'...`);
  const start = Date.now();
  const placesClient = new PlacesClient({
    apiKey: configuration.apiKey
  });
  try {
    const response = await placesClient.getPlace(
      {
        name: `places/${placeId}`
      },
      {
        otherArgs: {
          headers: {
            "X-Goog-FieldMask": DETAIL_FIELDS_MASK
          }
        }
      }
    );
    console.info(`[Google Place] Finding the place with id='${placeId}'. Done in ${Date.now() - start}ms`);
    return response?.[0];
  } catch (e) {
    throw parseError(e, `placeId='${placeId}'`, Date.now() - start);
  }
}

export async function searchGoogleRestaurantByText(
  searchableText: string,
  latitude: number,
  longitude: number,
  configuration: GooglePlaceConfiguration = DEFAULT_GOOGLE_PLACE_CONFIGURATION,
  signal?: AbortSignal | undefined
): Promise<GoogleRestaurant | undefined> {
  const comparable = { displayName: searchableText, latitude: latitude, longitude: longitude };
  return (
    (
      await findPlacesByText(
        searchableText,
        latitude,
        longitude,
        3,
        SEARCH_FIELDS_MASK,
        configuration
      )
    )
    .map(convertGooglePlaceToRestaurant)
    ?.filter(Boolean)
    ?.map((restaurant) => ({ restaurant: restaurant!, match: compareSimilarity(comparable, restaurant!, configuration.similarity) }))
    ?.sort((a, b) => b.match.totalScore - a.match.totalScore)
    ?.map(match => addPhotoUriOn(match.restaurant, configuration, signal))
    ?.[0]
  );
}

async function findPlacesByText(
  searchableText: string,
  latitude: number,
  longitude: number,
  maximumNumberOfResultsToQuery: number,
  fieldMask: string,
  configuration: GooglePlaceConfiguration,
): Promise<protos.google.maps.places.v1.IPlace[]> {
  console.log(`[Google Place] Finding the place near '${latitude},${longitude}' with text = '${searchableText}'...`);
  const start = Date.now();
  const placesClient = new PlacesClient({
    apiKey: configuration.apiKey
  });

  // using the "locationRestrictions" is superior to "locationBias" that returns unwanted results (like far far far away from the origin point)
  const viewport = computeViewportFromCircle({ latitude: latitude, longitude: longitude }, configuration.search.radiusInMeters);
  try {
    const response = await placesClient.searchText(
      {
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
        },
        textQuery: searchableText
      },
      {
        maxResults: maximumNumberOfResultsToQuery,
        otherArgs: {
          headers: {
            "X-Goog-FieldMask": fieldMask
          }
        }
      }
    );
    console.log(`[Google Place] Finding the place near '${latitude},${longitude}' with text = '${searchableText}'. Done in ${Date.now() - start}ms`);
    return response?.[0]?.places || [];
  } catch (e) {
    throw parseError(e, `near '${latitude},${longitude}' with text = '${searchableText}'`, Date.now() - start);
  }
}

async function findGoogleImageUrl(
  photoId: string,
  apiKey: string,
  maxWidthPx: number,
  maxHeightPx: number
): Promise<string | null | undefined> {
  console.info(`[Google Place] Finding photo for id='${photoId}'...`);
  const start = Date.now();
  const placesClient = new PlacesClient({
    apiKey: apiKey
  });

  try {
    const resourceName = photoId?.endsWith("/media") ? photoId : `${photoId}/media`;
    const placeResponse = await placesClient.getPhotoMedia(
      {
        name: resourceName,
        maxWidthPx: maxWidthPx,
        maxHeightPx: maxHeightPx,
        skipHttpRedirect: true
      }
    );
    console.info(`[Google Place] Finding photo for id='${photoId}'. Done in ${Date.now() - start}ms.`);
    return placeResponse[0]?.photoUri;
  } catch (e) {
    throw parseError(e, `photoId='${photoId}'`, Date.now() - start);
  }
}

function convertGooglePlaceToRestaurant(
  place: protos.google.maps.places.v1.IPlace | undefined
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
    const photoUrl = await googleCircuitBreaker().execute(async ({ signal: combinedSignal }) => {
      if (combinedSignal?.aborted) {
        throw combinedSignal.reason;
      }
      return findGoogleImageUrl(photoId, configuration.apiKey, configuration.photo.maxWidthInPx, configuration.photo.maxHeightInPx);
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
  const statusCode = e.code || 500;
  const responseBody = e.details || e.message || "Unknown error";

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
