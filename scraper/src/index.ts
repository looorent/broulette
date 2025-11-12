import * as dotenv from "dotenv";
import { Catalog } from "./catalog/catalog";
import { readCatalogFromStorage, writeCatalogToStorage } from "./catalog/storage";
import { GoogleRestaurantRepository } from "./google/repository";
import { OsmError } from "./overpass/error";
import { fetchAllRestaurantsWithRetriesInCountry } from "./overpass/repository";
import { TripAdvisorRestaurantRepository } from "./tripadvisor/repository";
import { GoogleRestaurantService } from "./google/service";
import { TripAdvisorService } from "./tripadvisor/service";
dotenv.config();

const COUNTRY_IN_ISO_3166: string = process.env["COUNTRY_IN_ISO_3166"] || "BE";
const OVERPASS_TIMEOUT: number = parseInt(process.env["OVERPASS_TIMEOUT"] || "180");
const OUTPUT_FOLDER: string = process.env["OUTPUT_FOLDER"] || "./output";

const GOOGLE_PLACE_API_KEY = process.env["GOOGLE_PLACE_API_KEY"];
const GOOGLE_PLACE_MAX_NUMBER_OF_CALLS: number = parseInt(process.env["GOOGLE_PLACE_MAX_NUMBER_OF_CALLS"] || "100");
const GOOGLE_PLACE_RADIUS_IN_METER: number = parseInt(process.env["GOOGLE_PLACE_RADIUS_IN_METER"] || "50");
const GOOGLE_PLACE_LOAD_IDS: boolean = (process.env["GOOGLE_PLACE_LOAD_IDS"] || "false").trim().toLowerCase() === "true";
const GOOGLE_PLACE_LOAD_DETAILS: boolean = (process.env["GOOGLE_PLACE_LOAD_DETAILS"] || "false").trim().toLowerCase() === "true";

const TRIP_ADVISOR_API_KEY = process.env["TRIP_ADVISOR_API_KEY"];
const TRIP_ADVISOR_MAX_NUMBER_OF_CALLS: number = parseInt(process.env["TRIP_ADVISOR_MAX_NUMBER_OF_CALLS"] || "100");
const TRIP_ADVISOR_RADIUS_IN_METER: number = parseInt(process.env["TRIP_ADVISOR_RADIUS_IN_METER"] || "25");
const TRIP_ADVISOR_LOAD_IDS: boolean = (process.env["TRIP_ADVISOR_LOAD_IDS"] || "false").trim().toLowerCase() === "true";
const TRIP_ADVISOR_LOAD_DETAILS: boolean = (process.env["TRIP_ADVISOR_LOAD_DETAILS"] || "false").trim().toLowerCase() === "true";

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
        console.log(`[Google Plrace] There is a key available to contact Google ${GOOGLE_PLACE_MAX_NUMBER_OF_CALLS} times to find the matching restaurants. Processing...`);
        const repository = new GoogleRestaurantRepository(GOOGLE_PLACE_API_KEY, GOOGLE_PLACE_MAX_NUMBER_OF_CALLS);
        const service = new GoogleRestaurantService(repository, GOOGLE_PLACE_LOAD_IDS, GOOGLE_PLACE_LOAD_DETAILS, GOOGLE_PLACE_RADIUS_IN_METER);
        return await service.findGooglePlacesAndMerge(catalog);
    } else {
        console.error("[Google Place] There is no environment variable named 'GOOGLE_PLACE_API_KEY' to contact the API of Google Place.")
        return catalog;
    }
}

async function addTripAdvisorRestaurantsIn(catalog: Catalog): Promise<Catalog> {
    if (TRIP_ADVISOR_API_KEY) {
        console.log(`[TripAdvisor] There is a key available to contact TripAdvisor ${TRIP_ADVISOR_MAX_NUMBER_OF_CALLS} times to find the matching restaurants. Processing...`);
        const repository = new TripAdvisorRestaurantRepository(TRIP_ADVISOR_API_KEY, TRIP_ADVISOR_MAX_NUMBER_OF_CALLS);
        const service = new TripAdvisorService(repository, TRIP_ADVISOR_LOAD_IDS, TRIP_ADVISOR_LOAD_DETAILS, TRIP_ADVISOR_RADIUS_IN_METER);
        return service.findTripAdvisorLocationsAndMerge(catalog);
    } else {
        console.error("[TripAdvisor] There is no environment variable named 'TRIP_ADVISOR_API_KEY' to contact the API of Trip Advisor.")
        return catalog;
    }
}

async function main() {
    let catalog = readCatalogFromStorage(OUTPUT_FOLDER).increaseVersion();
    catalog = await addOrUpdateOverpassRestaurantsIn(catalog);
    catalog = await addGoogleRestaurantsIn(catalog);
    catalog = await addTripAdvisorRestaurantsIn(catalog);
    catalog = writeCatalogToStorage(catalog, OUTPUT_FOLDER);
    return catalog.printHighlights();
}

main();