import { Catalog } from "./catalog/catalog";
import { readCatalogFromStorage, writeCatalogToStorage } from "./catalog/storage";
import { GoogleExceedsNumberOfCallsError } from "./google/error";
import { GoogleRestaurantRepository } from "./google/repository";
import { OsmError } from "./overpass/error";
import { fetchAllRestaurantsWithRetriesInCountry } from "./overpass/repository";
import "dotenv/config";

const COUNTRY_IN_ISO_3166: string = process.env["COUNTRY_IN_ISO_3166"] || "BE";
const OVERPASS_TIMEOUT: number = parseInt(process.env["COUNTRY_IN_ISO_3166"] || "180");
const OUTPUT_FOLDER: string = process.env["OUTPUT_FOLDER"] || "./output";

const GOOGLE_PLACE_API_KEY = process.env["GOOGLE_PLACE_API_KEY"];
const GOOGLE_PLACE_MAX_NUMBER_OF_CALLS: number = parseInt(process.env["GOOGLE_PLACE_MAX_NUMBER_OF_CALLS"] || "100");

const GOOGLE_PLACE_RADIUS_IN_METER: number = parseInt(process.env["GOOGLE_PLACE_RADIUS_IN_METER"] || "50");
const GOOGLE_PLACE_MAXIMUM_NUMBER_OF_CALLS: number = parseInt(process.env["GOOGLE_PLACE_MAXIMUM_NUMBER_OF_CALLS"] || "100");

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
        const client = new GoogleRestaurantRepository(GOOGLE_PLACE_API_KEY, GOOGLE_PLACE_MAX_NUMBER_OF_CALLS);
        let stopped = false;
        let updatedCatalog = catalog;
        for (let index = 0; index < catalog.restaurants.length && !stopped; index++) {
            const restaurant = catalog.restaurants[index]!;
            if (!restaurant.hasGoogleRestaurant() && restaurant.overpassRestaurant) {
                try {
                    const googleRestaurants = await client.findRestaurants(restaurant.overpassRestaurant.latitude, restaurant.overpassRestaurant.longitude, GOOGLE_PLACE_RADIUS_IN_METER, GOOGLE_PLACE_MAXIMUM_NUMBER_OF_CALLS);
                    updatedCatalog.mergeWithGooglePlace(restaurant.id, googleRestaurants);
                } catch (e) {
                    if (e instanceof GoogleExceedsNumberOfCallsError) {
                        console.log("Maximum number of calls to Google Places exceeds the limit. Stop this part of the process to avoid paying too much.");
                    } else {
                        console.error("An error occurred when calling google place API. Stop this part of the process.", e)
                    }
                    stopped = true;
                }
            }        
        }
        return updatedCatalog;
    } else {
        console.error("There is no environment variable named 'GOOGLE_PLACE_API_KEY' to contact the API of Google Place.")
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

    return writeCatalogToStorage(catalog, OUTPUT_FOLDER);
}

main();