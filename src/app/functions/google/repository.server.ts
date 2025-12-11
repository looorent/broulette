import { PlacesClient, protos } from "@googlemaps/places";
import { GoogleRestaurant } from "./types.server";

const GOOGLE_PLACE_API_KEY = import.meta.env.VITE_GOOGLE_PLACE_API_KEY;
const GOOGLE_PLACE_API_TIMEOUT_IN_SECONDS = import.meta.env.VITE_GOOGLE_PLACE_API_TIMEOUT_IN_SECONDS || 10000;

// TODO do something with this?
const RESTAURANT_TYPES: string[] = [
  "acai_shop",
  "afghani_restaurant",
  "african_restaurant",
  "american_restaurant",
  "asian_restaurant",
  "bar_and_grill",
  "barbecue_restaurant",
  "brazilian_restaurant",
  "breakfast_restaurant",
  "brunch_restaurant",
  "buffet_restaurant",
  "chinese_restaurant",
  "dessert_restaurant",
  "dessert_shop",
  "fast_food_restaurant",
  "fine_dining_restaurant",
  "french_restaurant",
  "greek_restaurant",
  "hamburger_restaurant",
  "indian_restaurant",
  "indonesian_restaurant",
  "italian_restaurant",
  "japanese_restaurant",
  "korean_restaurant",
  "lebanese_restaurant",
  "meal_delivery",
  "meal_takeaway",
  "mediterranean_restaurant",
  "mexican_restaurant",
  "middle_eastern_restaurant",
  "pizza_restaurant",
  "pub",
  "ramen_restaurant",
  "restaurant",
  "seafood_restaurant",
  "spanish_restaurant",
  "steak_house",
  "sushi_restaurant",
  "thai_restaurant",
  "turkish_restaurant",
  "vegan_restaurant",
  "vegetarian_restaurant",
  "vietnamese_restaurant"
];

const COMPLETE_FIELDS_FILTER = "*"; // TODO reduce this mask

async function findPlacesByText(
  searchableText: string,
  latitude: number,
  longitude: number,
  radiusInMeters: number,
  maximumNumberOfResultsToQuery: number,
  fieldMask: string
): Promise<protos.google.maps.places.v1.IPlace[]> {
  const placesClient = new PlacesClient({
    apiKey: GOOGLE_PLACE_API_KEY
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
      timeout: GOOGLE_PLACE_API_TIMEOUT_IN_SECONDS,
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
  radiusInMeters: number
): Promise<GoogleRestaurant> {
  return (
    (
      await findPlacesByText(
        searchableText,
        latitude,
        longitude,
        radiusInMeters,
        1,
        COMPLETE_FIELDS_FILTER
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
