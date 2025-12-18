import { computeViewportFromCircle } from "@features/coordinate";
import { PlacesClient, type protos } from "@googlemaps/places";
import { googleCircuitBreaker } from "./circuit-breaker";
import { convertBusinessStatusToOperational, formatPrices } from "./formatter";
import { convertGooglePeriodsToOpeningHours } from "./opening-hours";
import { compareSimilarity, type GoogleSimilarityConfiguration } from "./similarity";
import type { GooglePlaceConfiguration, GoogleRestaurant } from "./types";

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
  configuration: GooglePlaceConfiguration,
  signal?: AbortSignal | undefined
): Promise<GoogleRestaurant | undefined> {
  const placesClient = new PlacesClient({
    apiKey: configuration.apiKey
  });

  const response = await googleCircuitBreaker().execute(async ({ signal: combinedSignal }) => {
    if (signal?.aborted) {
      throw signal.reason;
    }
    return await placesClient.getPlace(
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
  }, signal);

  const place = response?.[0];
  if (place) {
    return addPhotoUriOn(convertGooglePlaceToRestaurant(place!), configuration, signal);
  } else {
    return undefined;
  }
}

async function findPlacesByText(
  searchableText: string,
  latitude: number,
  longitude: number,
  radiusInMeters: number,
  maximumNumberOfResultsToQuery: number,
  fieldMask: string,
  configuration: GooglePlaceConfiguration,
): Promise<protos.google.maps.places.v1.IPlace[]> {
  const placesClient = new PlacesClient({
    apiKey: configuration.apiKey
  });

  // using the "locationRestrictions" is superior to "locationBias" that returns unwanted results (like far far far away from the origin point)
  const viewport = computeViewportFromCircle({ latitude: latitude, longitude: longitude }, radiusInMeters);
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
  return response?.[0]?.places || [];
}

export async function searchGoogleRestaurantByText(
  searchableText: string,
  latitude: number,
  longitude: number,
  radiusInMeters: number,
  configuration: GooglePlaceConfiguration,
  similarityConfiguration: GoogleSimilarityConfiguration,
  signal?: AbortSignal | undefined
): Promise<GoogleRestaurant | undefined> {
  const comparable = { displayName: searchableText, location: { latitude: latitude, longitude: longitude } };
  return (
    (
      await findPlacesByText(
        searchableText,
        latitude,
        longitude,
        radiusInMeters,
        3,
        SEARCH_FIELDS_MASK,
        configuration
      )
    )
    .map(convertGooglePlaceToRestaurant)
    ?.filter(Boolean)
    ?.map((restaurant) => ({ restaurant: restaurant!, match: compareSimilarity(comparable, restaurant!, similarityConfiguration) }))
    ?.sort((a, b) => b.match.totalScore - a.match.totalScore)
    ?.map(match => addPhotoUriOn(match.restaurant, configuration, signal))
    ?.[0]
  );
}

async function findGoogleImageUrl(
  photoId: string,
  apiKey: string,
  maxWidthPx: number,
  maxHeightPx: number,
  signal?: AbortSignal | undefined
): Promise<string | null | undefined> {
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
    return placeResponse[0]?.photoUri;
  } catch (e) {
    console.error(`Error when loading the photo ${photoId}`, e);
    return undefined;
  }
}

function convertGooglePlaceToRestaurant(
  place: protos.google.maps.places.v1.IPlace
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
      location: place.location?.latitude && place.location?.longitude ? {
        latitude: place?.location!.latitude,
        longitude: place?.location!.longitude
      } : undefined,
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
      if (signal?.aborted) {
        throw signal.reason;
      }
      return findGoogleImageUrl(photoId, configuration.apiKey, configuration.photo.maxWidthInPx, configuration.photo.maxHeightInPx, signal);
    }, signal);

    if (photoUrl) {
      restaurant.photoUrl = photoUrl;
    }
    return restaurant;
  } else {
    return undefined;
  }
}
