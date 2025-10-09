import { fetchAllRestaurantsInCountry } from "./osm_service.js";
import { completeMetadataWithOverpass, completeRestaurantsWithOverpass } from "./restaurant_service.js";
import { readFromStorage, writeToStorage } from "./restaurant_storage.js";

function increaseVersionOf(data) {
    const updatedData = structuredClone(data);
    updatedData.version += 1;
    return updatedData;
}

async function main() {
    const outputFolder = "../../../output";
    const existingData = readFromStorage(outputFolder);
    let updatedData = increaseVersionOf(existingData);

    // overpass
    const overpassResponse = await fetchAllRestaurantsInCountry("BE");
    updatedData = completeMetadataWithOverpass(updatedData, overpassResponse);
    updatedData.restaurants = completeRestaurantsWithOverpass(updatedData.restaurants, overpassResponse.restaurants);

    // other sources? (todo)

    return writeToStorage(updatedData, outputFolder);
}

main();