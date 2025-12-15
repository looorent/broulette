import { computeViewportFromCircle } from "@features/coordinate";
import { PlacesClient, type protos } from "@googlemaps/places";
import { convertGooglePeriodsToOpeningHours } from "./opening-hours";
import type { GoogleRestaurant } from "./types";
import { compareSimilarity, type GoogleSimilarityConfiguration } from "./similarity";

const FIELDS_MASK = [
  "places.id",
  "places.name",
  "places.displayName",
  "places.location",
  "places.formattedAddress",
  "places.addressComponents",
  "places.types",
  "places.businessStatus",
  "places.googleMapsUri",
  "places.rating",
  "places.regularOpeningHours",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.priceRange",
  "places.userRatingCount",
  "places.primaryType"
].join(",");

export async function findGoogleRestaurantById(
  placeId: string,
  apiKey: string,
  retry: number
): Promise<GoogleRestaurant | undefined> {
  const placesClient = new PlacesClient({
    apiKey: apiKey
  });

  const response = await placesClient.getPlace(
    {
      name: `places/${placeId}`
    },
    {
      maxRetries: retry,
      otherArgs: {
        headers: {
          "X-Goog-FieldMask": FIELDS_MASK
        }
      }
    }
  );

  const place = response?.[0];
  if (place) {
    return convertGooglePlaceToRestaurant(place!);
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
  apiKey: string,
  timeout: number
): Promise<protos.google.maps.places.v1.IPlace[]> {
  const placesClient = new PlacesClient({
    apiKey: apiKey
  });

  // using the "locationRestrictions" is superior to "locationBias" that returns unwanted results (like far far far away from the origin point)
  const viewport = computeViewportFromCircle({ latitude: latitude, longitude: longitude }, radiusInMeters);
  const response = await placesClient.searchText(
    {
      rankPreference: "RELEVANCE",
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
      timeout: timeout,
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
  apiKey: string,
  timeout: number,
  similarityConfiguration: GoogleSimilarityConfiguration
): Promise<GoogleRestaurant | undefined> {
  const comparable = { name: searchableText, location: { latitude: latitude, longitude: longitude } };
  return (
    (
      await findPlacesByText(
        searchableText,
        latitude,
        longitude,
        radiusInMeters,
        3,
        FIELDS_MASK,
        apiKey,
        timeout
      )
    )
    .map(convertGooglePlaceToRestaurant)
    ?.filter(Boolean)
    ?.map((restaurant) => ({ restaurant: restaurant!, match: compareSimilarity(comparable, restaurant!, similarityConfiguration) }))
    ?.sort((a, b) => b.match.totalScore - a.match.totalScore)
    ?.map(match => match.restaurant)
    ?.[0]
  );
}

function convertGooglePlaceToRestaurant(
  place: protos.google.maps.places.v1.IPlace
): GoogleRestaurant | undefined {
  if (place) {
    return {
      id: place.id!,
      name: place.name,
      displayName: place.displayName?.text,
      types: place.types || [],
      primaryType: place.primaryType,
      nationalPhoneNumber: place.nationalPhoneNumber,
      internationalPhoneNumber: place.internationalPhoneNumber,
      formattedAddress: place.formattedAddress,
      countryCode: place.addressComponents?.find(component => component?.types?.includes("country"))?.shortText?.toLowerCase(),
      shortFormattedAddress: place.shortFormattedAddress,
      location: location ? {
        latitude: place?.location!.latitude!,
        longitude: place?.location!.longitude!
      } : undefined,
      rating: place.rating,
      userRatingCount: place.userRatingCount,
      googleMapsUri: place.googleMapsUri,
      websiteUri: place.websiteUri,
      openingHours: place.regularOpeningHours ? convertGooglePeriodsToOpeningHours(place.regularOpeningHours) : undefined,
      operational: convertBusinessStatusToOperational(place.businessStatus?.toString()),
      priceLevel: convertPriceLevelToNumber(place.priceLevel?.toString())
    }
  } else {
    return undefined;
  }
}

function convertPriceLevelToNumber(priceLevel: string | undefined | null): number | null {
  switch (priceLevel) {
    case "PRICE_LEVEL_INEXPENSIVE":
      return 1;
    case "PRICE_LEVEL_MODERATE":
      return 2;
    case "PRICE_LEVEL_EXPENSIVE":
      return 3;
    case "PRICE_LEVEL_VERY_EXPENSIVE":
      return 4;
    case "PRICE_LEVEL_FREE":
      return 0;
    case "PRICE_LEVEL_UNSPECIFIED":
    default:
      return null;
  }
}

const OPERATIONAL_BUSINESS_STATUS = "OPERATIONAL"
function convertBusinessStatusToOperational(status: string | undefined | null): boolean | undefined {
  if (status) {
    return status === OPERATIONAL_BUSINESS_STATUS;
  } else {
    return undefined;
  }
}
