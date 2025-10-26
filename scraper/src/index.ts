import * as dotenv from "dotenv";
import { Catalog } from "./catalog/catalog";
import { readCatalogFromStorage, writeCatalogToStorage } from "./catalog/storage";
import { GoogleExceedsNumberOfCallsError } from "./google/error";
import { GoogleRestaurantRepository } from "./google/repository";
import { OsmError } from "./overpass/error";
import { fetchAllRestaurantsWithRetriesInCountry } from "./overpass/repository";
dotenv.config();

const COUNTRY_IN_ISO_3166: string = process.env["COUNTRY_IN_ISO_3166"] || "BE";
const OVERPASS_TIMEOUT: number = parseInt(process.env["OVERPASS_TIMEOUT"] || "180");
const OUTPUT_FOLDER: string = process.env["OUTPUT_FOLDER"] || "./output";

const GOOGLE_PLACE_API_KEY = process.env["GOOGLE_PLACE_API_KEY"];
const GOOGLE_PLACE_MAX_NUMBER_OF_CALLS: number = parseInt(process.env["GOOGLE_PLACE_MAX_NUMBER_OF_CALLS"] || "100");

const GOOGLE_PLACE_RADIUS_IN_METER: number = parseInt(process.env["GOOGLE_PLACE_RADIUS_IN_METER"] || "50");
const GOOGLE_PLACE_MAXIMUM_NUMBER_OF_PLACE_PER_SEARCH: number = parseInt(process.env["GOOGLE_PLACE_MAXIMUM_NUMBER_OF_PLACE_PER_SEARCH"] || "1");

const GOOGLE_PLACE_LOAD_ID_ONLY: boolean = (process.env["GOOGLE_PLACE_LOAD_ID_ONLY"] ?? "true").trim().toLowerCase() === "true";

async function addOrUpdateOverpassRestaurantsIn(catalog: Catalog): Promise<Catalog> {
    try {
        const overpassResponse = await fetchAllRestaurantsWithRetriesInCountry(COUNTRY_IN_ISO_3166, OVERPASS_TIMEOUT);
        return catalog.mergeWithOverpass(overpassResponse);
    } catch (e) {
        if (e instanceof OsmError) {
            const errorMessage = `Error when fetching restaurants from OSM! ${(e as OsmError).message}`;
            console.error(errorMessage, (e as OsmError).responseBody);
            throw e;
        } else {
            console.error("Unexpected error when fetching restaurants from OSM", e);
            throw e;
        }
    }
}

async function addGoogleRestaurantsIn(catalog: Catalog): Promise<Catalog> {
    if (GOOGLE_PLACE_API_KEY) {
        console.log(`[Google Place] There is a key available to contact Google ${GOOGLE_PLACE_MAX_NUMBER_OF_CALLS} times to find the matching restaurants. Processing...`);
        const client = new GoogleRestaurantRepository(GOOGLE_PLACE_API_KEY, GOOGLE_PLACE_MAX_NUMBER_OF_CALLS);
        let stopped = false;
        const now = new Date();
        let updatedCatalog = catalog.clone();
        for (let index = 0; index < updatedCatalog.restaurants.length && !stopped; index++) {
            const restaurant = updatedCatalog.restaurants[index]!;
            if (restaurant.hasOverpassName() && !restaurant.hasBeenSearchedWithGoogleInTheLastMonth(now)) {
                const searchText = restaurant.overpassRestaurant!.createSearchableText();
                try {
                    if (GOOGLE_PLACE_LOAD_ID_ONLY) {
                        console.debug(`[Google Place] Finding Google Place ID for the restaurant '${restaurant.id}' with the search text '${searchText}' located at (${restaurant.overpassRestaurant!.latitude}, ${restaurant.overpassRestaurant!.longitude})...`);
                        let googleRestaurantId = await client.findRestaurantIdentifierByText(searchText, restaurant.overpassRestaurant!.latitude, restaurant.overpassRestaurant!.longitude, GOOGLE_PLACE_RADIUS_IN_METER);
                        if (!googleRestaurantId) {
                            console.debug(`[Google Place] Finding Google Place ID for the restaurant '${restaurant.id}' failed with the search text '${searchText}' located at (${restaurant.overpassRestaurant!.latitude}, ${restaurant.overpassRestaurant!.longitude}).  Trying the search 'nearby'...`);
                            googleRestaurantId = await client.findRestaurantIdentifierNearby(restaurant.overpassRestaurant!.latitude, restaurant.overpassRestaurant!.longitude, GOOGLE_PLACE_RADIUS_IN_METER);
                        }
                        console.debug(`[Google Place] Finding Google Place ID for the restaurant '${restaurant.id}' with the name '${restaurant.overpassRestaurant!.name}' located at (${restaurant.overpassRestaurant!.latitude}, ${restaurant.overpassRestaurant!.longitude}): ${googleRestaurantId?.id || "Not found"}`);
                        updatedCatalog = updatedCatalog.mergeWithGooglePlaceIdentifier(restaurant.id, googleRestaurantId);
                    } else {
                        console.debug(`[Google Place] Finding Google Place for the restaurant '${restaurant.id}' with the search text '${searchText}' located at (${restaurant.overpassRestaurant!.latitude}, ${restaurant.overpassRestaurant!.longitude})...`);
                        let googleRestaurants = await client.findRestaurantsByText(searchText, restaurant.overpassRestaurant!.latitude, restaurant.overpassRestaurant!.longitude, GOOGLE_PLACE_RADIUS_IN_METER, GOOGLE_PLACE_MAXIMUM_NUMBER_OF_PLACE_PER_SEARCH);
                        if (googleRestaurants.length <= 0) {
                            console.debug(`[Google Place] Finding Google Place for the restaurant '${restaurant.id}' failed with the search text '${searchText}' located at (${restaurant.overpassRestaurant!.latitude}, ${restaurant.overpassRestaurant!.longitude}).  Trying the search 'nearby'...`);
                            googleRestaurants = await client.findRestaurantsNearby(restaurant.overpassRestaurant!.latitude, restaurant.overpassRestaurant!.longitude, GOOGLE_PLACE_RADIUS_IN_METER, GOOGLE_PLACE_MAXIMUM_NUMBER_OF_PLACE_PER_SEARCH);
                        }
                        console.debug(`[Google Place] Finding Google Place for the restaurant '${restaurant.id}' with the name '${restaurant.overpassRestaurant!.name}' located at (${restaurant.overpassRestaurant!.latitude}, ${restaurant.overpassRestaurant!.longitude}): ${googleRestaurants.length} places found.`);
                        updatedCatalog = updatedCatalog.mergeWithGooglePlace(restaurant.id, googleRestaurants);
                    }
                } catch (e) {
                    if (e instanceof GoogleExceedsNumberOfCallsError) {
                        console.log("[Google Place] Maximum number of calls to Google Places exceeds the limit. Stop this part of the process to avoid paying too much.");
                    } else {
                        // TODO Lorent this occurs too often, handle it better by retrying the call (maybe use the circuit breaker?)
                        console.error("[Google Place] An error occurred when calling google place API. Stop this part of the process.", e)
                    }
                    stopped = true;
                }
            }        
        }
        return updatedCatalog;
    } else {
        console.error("[Google Place] There is no environment variable named 'GOOGLE_PLACE_API_KEY' to contact the API of Google Place.")
        return catalog;
    }
}

async function main() {
    let catalog = readCatalogFromStorage(OUTPUT_FOLDER).increaseVersion();

    // overpass
    catalog = await addOrUpdateOverpassRestaurantsIn(catalog);

    // google
    catalog = await addGoogleRestaurantsIn(catalog);

    // other sources? tripadvisor? (todo)

    catalog = writeCatalogToStorage(catalog, OUTPUT_FOLDER);

    return catalog.printHighlights();
}

main();