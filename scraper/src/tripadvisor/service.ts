import type { Catalog, Restaurant } from "../catalog/catalog";
import { TripAdvisorExceedsNumberOfCallsError } from "./error";
import type { TripAdvisorRestaurantRepository } from "./repository";
import { TripAdvisorSearchResult } from "./types";

export class TripAdvisorService {
    constructor(
        private readonly repository: TripAdvisorRestaurantRepository,
        private readonly loadLocationIds: boolean, // to avoid a big invoice
        private readonly loadLocationDetails: boolean,
        private readonly radiusInMeter: number
    ) { }

    async findTripAdvisorLocationsAndMerge(catalog: Catalog, language: string = "en"): Promise<Catalog> {
        let stopped = false;
        let updatedCatalog = catalog.clone();
        for (let index = 0; index < updatedCatalog.restaurants.length && !stopped; index++) {
            const restaurant = updatedCatalog.restaurants[index]!;
            try {
                updatedCatalog = await this.findTripAdvisorLocationAndMergeWith(restaurant, updatedCatalog, language);
            } catch (e) {
                if (e instanceof TripAdvisorExceedsNumberOfCallsError) {
                    console.log("[TripAdvisor] Maximum number of calls to TripAdvisors exceeds the limit. Stop this part of the process to avoid paying too much.");
                } else {
                    console.error("[TripAdvisor] An error occurred when calling TripAdvisor API. Stop this part of the process.", e)
                }
                stopped = true;
            } 
        }
        return updatedCatalog;
    }

    async findTripAdvisorLocationAndMergeWith(restaurant: Restaurant, catalog: Catalog, language: string = "en"): Promise<Catalog> {
        const now = new Date();
        if (restaurant.canBeSearched() && !restaurant.hasBeenSearchedWithTripAdvisorInTheLastMonth(now)) {
            let search = restaurant.tripAdvisor;

            if (this.loadLocationIds && !search?.locationId) {
                console.debug(`[TripAdvisor] Finding TripAdvisor Location ID for the restaurant '${restaurant.id}' with name '${restaurant.overpassRestaurant!.name}' located at (${restaurant.overpassRestaurant!.latitude}, ${restaurant.overpassRestaurant!.longitude})...`);
                const locationsFound = (await this.repository.findLocationsNearby(restaurant.overpassRestaurant!.name, restaurant.overpassRestaurant!.latitude!, restaurant!.overpassRestaurant!.longitude!, this.radiusInMeter,  restaurant.overpassRestaurant!.addressStreetWithNumber, language));
                if (locationsFound?.length > 0) {
                    console.debug(`[TripAdvisor] Finding TripAdvisor Location ID for the restaurant '${restaurant.id}' with name '${restaurant.overpassRestaurant!.name}' located at (${restaurant.overpassRestaurant!.latitude}, ${restaurant.overpassRestaurant!.longitude}): ${locationsFound.length} locations found.`);
                    search = TripAdvisorSearchResult.fromLocationSearch(locationsFound, now);
                } else {
                    console.debug(`[TripAdvisor] Finding TripAdvisor Location ID for the restaurant '${restaurant.id}' with name '${restaurant.overpassRestaurant!.name}' located at (${restaurant.overpassRestaurant!.latitude}, ${restaurant.overpassRestaurant!.longitude}): no location id found.`);
                    search = TripAdvisorSearchResult.empty(now);
                }
            }

            if (this.loadLocationDetails && search?.locationId) {
                console.debug(`[TripAdvisor] Finding TripAdvisor Location Detail for the restaurant '${restaurant.id}' with location id '${search.locationId}':...`);
                const locationFound = await this.repository.findLocationDetails(search.locationId, language, undefined);
                if (locationFound) {
                    console.debug(`[TripAdvisor] Finding TripAdvisor Location Detail for the restaurant '${restaurant.id}' with location id '${search.locationId}': Found with name '${locationFound.name}'.`);
                    search = search.withLocationDetail(locationFound!, now);
                } else {
                    console.warn(`[TripAdvisor] Finding TripAdvisor Location Detail for the restaurant '${restaurant.id}' with location id '${search.locationId}': Not found`);
                    search = TripAdvisorSearchResult.empty(now);
                }
            }

            return catalog.mergeWithTripAdvisorLocationSearch(restaurant.id, search);
        } else {
            return catalog;
        }
    }
}