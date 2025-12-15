import { PlacesClient, type protos } from "@googlemaps/places";
import { GoogleRestaurant } from "./types";

const COMPLETE_FIELDS_FILTER = "*"; // TODO reduce this mask

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
          "X-Goog-FieldMask": COMPLETE_FIELDS_FILTER
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

  const response = await placesClient.searchText(
    {
      rankPreference: "RELEVANCE",
      locationBias: {
        circle: {
          center: {
            latitude: latitude,
            longitude: longitude
          },
          radius: radiusInMeters
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

export async function findGoogleRestaurantByText(
  searchableText: string,
  latitude: number,
  longitude: number,
  radiusInMeters: number,
  apiKey: string,
  timeout: number
): Promise<GoogleRestaurant | undefined> {
  return (
    (
      await findPlacesByText(
        searchableText,
        latitude,
        longitude,
        radiusInMeters,
        1,
        COMPLETE_FIELDS_FILTER,
        apiKey,
        timeout
      )
    )
    .map(convertGooglePlaceToRestaurant)
    ?.filter(Boolean)
    .map((restaurant) => restaurant!)
    ?.[0]
  );
}

function convertGooglePlaceToRestaurant(
  place: protos.google.maps.places.v1.IPlace
): GoogleRestaurant | undefined {
  if (place) {
    return new GoogleRestaurant(
      place.id!,
      place.displayName?.text || "Unknown",
      place.types!,
      place.nationalPhoneNumber!,
      place.internationalPhoneNumber!,
      place.formattedAddress!,
      place.addressComponents!,
      place.location!,
      place.viewport!,
      place.rating!,
      place.googleMapsUri!,
      place.websiteUri!,
      place.regularOpeningHours!,
      place.utcOffsetMinutes!,
      place.adrFormatAddress!,
      place.businessStatus!,
      place.priceLevel!,
      place.userRatingCount!,
      place.iconMaskBaseUri!,
      place.iconBackgroundColor!,
      place.displayName!,
      place.primaryTypeDisplayName!,
      place.takeout!,
      place.delivery!,
      place.dineIn!,
      place.reservable!,
      place.servesBreakfast!,
      place.servesLunch!,
      place.servesDinner!,
      place.servesBeer!,
      place.servesWine!,
      place.servesBrunch!,
      place.servesVegetarianFood!,
      place.currentOpeningHours!,
      place.primaryType!,
      place.shortFormattedAddress!,
      place.photos!,
      place
    );
  } else {
    return undefined;
  }
}
