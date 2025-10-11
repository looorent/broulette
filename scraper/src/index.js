import { createCircuitBreaker } from "./utils/circuit_breaker.js";
import { fetchAllRestaurantsInCountry, OsmError } from "./overpass/repository.js";
import { completeMetadataWithOverpass, completeRestaurantsWithOverpass } from "./catalog/scraper.js";
import { readFromStorage, writeToStorage } from "./catalog/storage.js";

const BELGIUM_IN_ISO_3166 = "BE";
const OVERPASS_TIMEOUT_FOR_BELGIUM = 180;

function increaseVersionOf(data) {
    const updatedData = structuredClone(data);
    updatedData.version += 1;
    return updatedData;
}

async function addOrUpdateOverpassRestaurantsIn(data) {
    try {
        const overpassResponse = await createCircuitBreaker(() => fetchAllRestaurantsInCountry(BELGIUM_IN_ISO_3166, OVERPASS_TIMEOUT_FOR_BELGIUM));
        const updatedData = completeMetadataWithOverpass(data, overpassResponse);
        updatedData.restaurants = completeRestaurantsWithOverpass(updatedData.restaurants, overpassResponse.restaurants);
        return updatedData;
    } catch (e) {
        if (e instanceof OsmError) {
            const errorMessage = `Error when fetching restaurants from OSM! ${e.message}`;
            console.error(errorMessage, e.responseBody);
            throw e;
        } else {
             console.error("Unexpected error when fetching restaurants from OSM", e);
             throw e;
        }
    }
}   
    
async function main() {
    const outputFolder = "../../../output";
    const existingData = readFromStorage(outputFolder);
    let updatedData = increaseVersionOf(existingData);

    // overpass
    updatedData = await addOrUpdateOverpassRestaurantsIn(updatedData);

    // other sources? (todo)

    return writeToStorage(updatedData, outputFolder);
}

main();