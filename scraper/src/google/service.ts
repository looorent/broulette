import type { Catalog, Restaurant } from "../catalog/catalog";
import { GoogleExceedsNumberOfCallsError } from "./error";
import type { GoogleRestaurantRepository } from "./repository";
import { GoogleRestaurantSearchResult } from "./types";

export class GoogleRestaurantService {
    constructor(
        private readonly repository: GoogleRestaurantRepository,
        private readonly loadPlaceIds: boolean, // to avoid a big invoice
        private readonly loadPlaceDetails: boolean,
        private readonly radiusInMeter: number
    ) { }

    async findGooglePlacesAndMerge(catalog: Catalog): Promise<Catalog> {
        let stopped = false;
        let updatedCatalog = catalog.clone();
        for (let index = 0; index < updatedCatalog.restaurants.length && !stopped; index++) {
            const restaurant = updatedCatalog.restaurants[index]!;
            try {
                updatedCatalog = await this.findGooglePlaceAndMergeWith(restaurant, updatedCatalog);
            } catch (e) {
                if (e instanceof GoogleExceedsNumberOfCallsError) {
                    console.log("[Google Place] Maximum number of calls to Google Places exceeds the limit. Stop this part of the process to avoid paying too much.");
                } else {
                    console.error("[Google Place] An error occurred when calling google place API. Stop this part of the process.", e)
                }
                stopped = true;
            }    
        }
        return updatedCatalog;
    }

    async findGooglePlaceAndMergeWith(restaurant: Restaurant, catalog: Catalog): Promise<Catalog> {
        const now = new Date();
        if (restaurant.canBeSearched() && !restaurant.hasBeenSearchedWithGoogleInTheLastMonth(now)) {
            const searchText = restaurant.overpassRestaurant!.createSearchableText();
            let search = restaurant.google;

            if (this.loadPlaceIds && !search?.placeId) {
                console.debug(`[Google Place] Finding Google Place ID for the restaurant '${restaurant.id}' with the search text '${searchText}' located at (${restaurant.overpassRestaurant!.latitude}, ${restaurant.overpassRestaurant!.longitude})...`);
                let placeIdFound = await this.repository.findRestaurantIdentifierByText(searchText, restaurant.overpassRestaurant!.latitude, restaurant.overpassRestaurant!.longitude, this.radiusInMeter);
                if (!placeIdFound || placeIdFound.length === 0) {
                    console.debug(`[Google Place] Finding Google Place ID for the restaurant '${restaurant.id}' failed with the search text '${searchText}' located at (${restaurant.overpassRestaurant!.latitude}, ${restaurant.overpassRestaurant!.longitude}).  Trying the search 'nearby'...`);
                    placeIdFound = await this.repository.findRestaurantIdentifierNearby(restaurant.overpassRestaurant!.latitude, restaurant.overpassRestaurant!.longitude, this.radiusInMeter);
                }

                if (placeIdFound && placeIdFound.length > 0) {
                    console.debug(`[Google Place] Finding Google Place ID for the restaurant '${restaurant.id}' with the name '${restaurant.overpassRestaurant!.name}' located at (${restaurant.overpassRestaurant!.latitude}, ${restaurant.overpassRestaurant!.longitude}): ${placeIdFound}`);
                    search = GoogleRestaurantSearchResult.fromPlaceId(placeIdFound, now);
                } else { 
                    console.debug(`[Google Place] Finding Google Place ID for the restaurant '${restaurant.id}' with the name '${restaurant.overpassRestaurant!.name}' located at (${restaurant.overpassRestaurant!.latitude}, ${restaurant.overpassRestaurant!.longitude}): No place found`);
                    search = GoogleRestaurantSearchResult.empty(now);
                }
            }

            if (this.loadPlaceDetails && search?.placeId && search?.placeId.length > 0) {
                console.debug(`[Google Place] Finding Google Place Detail for restaurant '${restaurant.id}' with the Place ID '${search.placeId}'...`);
                const placeFound = await this.repository.findRestaurantByPlaceId(search.placeId);
                if (placeFound) {
                    console.debug(`[Google Place] Finding Google Place Detail for restaurant '${restaurant.id}' with the Place ID '${search.placeId}'. Found with name '${placeFound.name}'.`);
                    search = search.withPlaceDetail(placeFound!, now);
                } else {
                    console.warn(`[Google Place] Finding Google Place Detail for restaurant '${restaurant.id}' with the Place ID '${search.placeId}'. Not found`);
                    search = GoogleRestaurantSearchResult.empty(now);
                }
            }

            return catalog.mergeWithGooglePlaceSearch(restaurant.id, search);
        } else {
            return catalog;
        }
    }
}