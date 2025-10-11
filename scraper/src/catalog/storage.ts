import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { OverpassResponse, OverpassRestaurant } from "../overpass/types";
import { Catalog, Restaurant } from "./catalog";

const LATEST_FILE_NAME = process.env["LATEST_FILE_NAME"] || "latest.json";

function formatTimestamp() {
    const iso = new Date().toISOString();
    const date = iso.slice(0, 10).replace(/-/g, "");
    const time = iso.slice(11, 19).replace(/:/g, "");
    return `${date}_${time}`;
}

function parseCatalogFromStorage(json: any): Catalog | undefined {
    if (json) {
        return new Catalog(json.version,
            parseOverpassResponseFromStorage(json.overpass),
            json.restaurants?.map(parseCatalogRestaurantsFromStorage)?.filter(Boolean) || []);
    } else {
        return undefined;
    }
}

function parseOverpassResponseFromStorage(json: any): OverpassResponse | undefined {
    if (json) {
        return new OverpassResponse(
            json.generator,
            json.version,
            json.copyright,
            json.timestampInUtc,
            json.durationInMs,
            json.restaurants?.map(parseOverpassRestaurantFromStorage)?.filter(Boolean) || [],
            json.raw
        );
    } else {
        return undefined;
    }
}

function parseOverpassRestaurantFromStorage(json: any): OverpassRestaurant | undefined {
    if (json) {
        return new OverpassRestaurant(
            json.id,
            json.type,
            json.name,
            json.latitude,
            json.longitude,
            json.tags,
            json.amenity
        );
    } else {
        return undefined;
    }
}

function parseCatalogRestaurantsFromStorage(json: any): Restaurant | undefined {
    if (json) {
        return new Restaurant(
            json.id,
            parseOverpassRestaurantFromStorage(json.overpassRestaurant)
        );
    } else {
        return undefined;
    }
}

export function readCatalogFromStorage(folderPath: string): Catalog {
    console.log(`Reading restaurants from storage at '${folderPath}'...`);
    const folder = resolve(folderPath);

    if (!existsSync(folder)) {
        mkdirSync(folder, { recursive: true });
    }

    const filePath = resolve(folderPath, LATEST_FILE_NAME);

    if (!existsSync(filePath)) {
        console.log(`Reading restaurants from storage at '${folderPath}'. File does not exist. Start from scratch.`);
        return Catalog.empty();
    } else {
        const catalog = parseCatalogFromStorage(readFileSync(filePath, "utf-8"));
        if (catalog) {
            console.log(`Reading restaurants from storage at '${folderPath}'. Done. ${catalog.numberOfRestaurants} restaurants found in version ${catalog.version}.`);
            return catalog;
        } else {
            console.log(`Reading restaurants from storage at '${folderPath}'. File does not seem to be parsed properly. Start from scratch.`);
            return Catalog.empty();
        }
    }
}

export function writeCatalogToStorage(catalog: Catalog, folderPath: string): Catalog {
    const formattedData = catalog?.asJson();
    const timestamp = formatTimestamp();

    const outputFile = resolve(join(folderPath, `${timestamp}_output.json`));
    console.log(`Writing restaurants to storage at '${outputFile}'...`);
    writeFileSync(outputFile, formattedData, "utf-8");
    console.log(`Writing restaurants to storage at '${outputFile}': done.`);

    const latestFile = resolve(join(folderPath, "latest.json"));
    console.log(`Writing restaurants to storage at '${latestFile}'...`);
    writeFileSync(latestFile, formattedData, "utf-8");
    console.log(`Writing restaurants to storage at '${latestFile}': done.`);
    return catalog;
}