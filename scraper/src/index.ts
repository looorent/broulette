import type { Catalog } from "./catalog/catalog";
import { readCatalogFromStorage, writeCatalogToStorage } from "./catalog/storage";
import { OsmError } from "./overpass/error";
import { fetchAllRestaurantsWithRetriesInCountry } from "./overpass/repository";

const COUNTRY_IN_ISO_3166: string = process.env["COUNTRY_IN_ISO_3166"] || "BE";
const OVERPASS_TIMEOUT: number = parseInt(process.env["COUNTRY_IN_ISO_3166"] || "180");
const OUTPUT_FOLDER: string = process.env["OUTPUT_FOLDER"] || "./output";


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

async function main() {
    let catalog = readCatalogFromStorage(OUTPUT_FOLDER).increaseVersion();

    // overpass
    catalog = await addOrUpdateOverpassRestaurantsIn(catalog);

    // other sources? google? tripadvisor? (todo)

    return writeCatalogToStorage(catalog, OUTPUT_FOLDER);
}

main();