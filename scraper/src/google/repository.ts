import { PlacesClient } from "@googlemaps/places";
import { GoogleRestaurant, GoogleRestaurantIdentifier } from "./types";
import { protos } from "@googlemaps/places";
import { GoogleExceedsNumberOfCallsError } from "./error";

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
]

const COMPLETE_FIELDS_FILTER = "*";
const ID_FIELDS_FILTER = "places.id";

export class GoogleRestaurantRepository {
    private numberOfCalls: number = 0;
    constructor(private readonly apiKey: string,
        private readonly maximumNumberOfCalls: number // to avoid a big invoice
    ) { }

    async findRestaurantIdentifierNearby(latitude: number, longitude: number, radiusInMeters: number): Promise<GoogleRestaurantIdentifier | undefined> {
        const places = await this.findPlacesNearby(latitude, longitude, radiusInMeters, 1, ID_FIELDS_FILTER);
        if (places?.length > 0) {
            return convertGooglePlaceToRestaurantIdentifier(places[0]!);
        } else {
            return undefined;
        }
    }

    async findRestaurantsNearby(latitude: number, longitude: number, radiusInMeters: number, maximumNumberOfResultsToQuery: number): Promise<GoogleRestaurant[]> {
        return (await this.findPlacesNearby(latitude, longitude, radiusInMeters, maximumNumberOfResultsToQuery, COMPLETE_FIELDS_FILTER))
            .map(convertGooglePlaceToRestaurant)?.filter(Boolean).map(restaurant => restaurant!) || [];
    }

    private async findPlacesNearby(latitude: number, longitude: number, radiusInMeters: number, maximumNumberOfResultsToQuery: number, fieldMask: string): Promise<protos.google.maps.places.v1.IPlace[]> {
        if (this.numberOfCalls > this.maximumNumberOfCalls) {
            throw new GoogleExceedsNumberOfCallsError(this.maximumNumberOfCalls, this.numberOfCalls);
        } else {
            this.numberOfCalls++;
            const placesClient = new PlacesClient({
                apiKey: this.apiKey
            });

            const response = await placesClient.searchNearby(
                {
                    includedTypes: RESTAURANT_TYPES,
                    locationRestriction: {
                        circle: {
                            center: {
                                latitude: latitude,
                                longitude: longitude
                            },
                            radius: radiusInMeters
                        }
                    },
                    maxResultCount: maximumNumberOfResultsToQuery
                }, {
                otherArgs: {
                    retry: 3, // TODO Lorent check the use of this retry counter
                    headers: {
                        "X-Goog-FieldMask": fieldMask
                    }
                }
            }
            );
            return response?.[0]?.places || [];
        }
    }

    async findRestaurantIdentifierByText(searchableText: string, latitude: number, longitude: number, radiusInMeters: number): Promise<GoogleRestaurantIdentifier | undefined> {
        const places = await this.findPlacesByText(searchableText, latitude, longitude, radiusInMeters, 1, ID_FIELDS_FILTER);
        if (places?.length > 0) {
            return convertGooglePlaceToRestaurantIdentifier(places[0]!);
        } else {
            return undefined;
        }
    }

    async findRestaurantsByText(searchableText: string, latitude: number, longitude: number, radiusInMeters: number, maximumNumberOfResultsToQuery: number): Promise<GoogleRestaurant[]> {
        return (await this.findPlacesByText(searchableText, latitude, longitude, radiusInMeters, maximumNumberOfResultsToQuery, COMPLETE_FIELDS_FILTER))
            .map(convertGooglePlaceToRestaurant)?.filter(Boolean).map(restaurant => restaurant!) || [];
    }

    private async findPlacesByText(searchableText: string, latitude: number, longitude: number, radiusInMeters: number, maximumNumberOfResultsToQuery: number, fieldMask: string): Promise<protos.google.maps.places.v1.IPlace[]> {
        if (this.numberOfCalls > this.maximumNumberOfCalls) {
            throw new GoogleExceedsNumberOfCallsError(this.maximumNumberOfCalls, this.numberOfCalls);
        } else {
            this.numberOfCalls++;
            const placesClient = new PlacesClient({
                apiKey: this.apiKey
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
                }, {
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
    }

    async findRestaurantByPlaceId(placeId: string): Promise<GoogleRestaurant | undefined> {
        if (placeId) {
            if (this.numberOfCalls > this.maximumNumberOfCalls) {
                throw new GoogleExceedsNumberOfCallsError(this.maximumNumberOfCalls, this.numberOfCalls);
            } else {
                this.numberOfCalls++;
                const placesClient = new PlacesClient({
                    apiKey: this.apiKey
                });

                const response = await placesClient.getPlace(
                    {
                        name: `places/${placeId}`
                    }, {
                        maxRetries: 3,
                        otherArgs: {
                            headers: {
                                "X-Goog-FieldMask": COMPLETE_FIELDS_FILTER
                            }
                        }
                    }
                );

                const place = response[0];
                if (place) {
                    return convertGooglePlaceToRestaurant(place);
                } else {
                    return undefined;
                }
            }
        } else {
            return undefined;
        }
    }

}

function convertGooglePlaceToRestaurantIdentifier(place: protos.google.maps.places.v1.IPlace): GoogleRestaurantIdentifier | undefined {
    if (place) {
        return new GoogleRestaurantIdentifier(
            place.id!
        );
    } else {
        return undefined;
    }
}

function convertGooglePlaceToRestaurant(place: protos.google.maps.places.v1.IPlace): GoogleRestaurant | undefined {
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

