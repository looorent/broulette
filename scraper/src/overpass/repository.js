import { CircuitBreakerError } from "../utils/circuit_breaker.js";

const OVERPASS_API_INSTANCE_URL = "https://overpass-api.de/api/interpreter";

function createQueryToListAllRestaurantsInCountry(countryCodeInIso3166, timeoutInSeconds) {
    return `
        [out:json][timeout:${parseInt(timeoutInSeconds)}];
        area["ISO3166-1"="${countryCodeInIso3166}"]->.searchArea;
        nwr["amenity"~"restaurant|fast_food"](area.searchArea);
        out tags center qt;
    `.trim();
}

export async function fetchAllRestaurantsInCountry(countryCodeInIso3166, timeoutInSeconds) {
    console.info(`Fetching all OSM restaurants in country '${countryCodeInIso3166}'...`);
    const query = createQueryToListAllRestaurantsInCountry(countryCodeInIso3166, timeoutInSeconds);
    const start = Date.now();
    const response = await fetch(
        OVERPASS_API_INSTANCE_URL,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
            },
            body: `data=${encodeURIComponent(query)}`
        }
    );

    const durationInMs = Date.now() - start;

    if (response.ok) {
        console.info(`Fetching all OSM restaurants in country '${countryCodeInIso3166}': done in ${durationInMs} ms.`);
        const body = await response.json();
        return {
            generator: body.generator,
            version: body.version,
            copyright: body.osm3s?.copyright,
            timestampInUtc: body.osm3s?.timestamp_osm_base,
            durationInMs: durationInMs,
            restaurants: body.elements
        };
    } else if (response.status >= 500) {
        throw new OsmServerError(query, response.status, await response.text(), durationInMs);
    } else {
        throw new OsmHttpError(query, response.status, await response.text(), durationInMs);
    }
}

export class OsmError extends CircuitBreakerError {
    constructor(message, query, responseStatusCode, responseBody, durationInMs) {
        super(message);
        this.name = "OsmError";
        this.query = query;
        this.responseStatusCode = responseStatusCode;
        this.responseBody = responseBody;
        this.durationInMs = durationInMs;
    }
}

class OsmServerError extends OsmError {
    constructor(query, responseStatusCode, responseBody, durationInMs) {
        super(`Fetching all OSM restaurants: server failed after ${durationInMs} ms with status code ${responseStatusCode}`, query, responseStatusCode, responseBody, durationInMs);
        this.name = "OsmServerError";
        this.retriable = true;
    }
}

class OsmHttpError extends OsmError {
    constructor(query, responseStatusCode, responseBody, durationInMs) {
        super(`Fetching all OSM restaurants: http call failed after ${durationInMs} ms with status code ${responseStatusCode}`, query, responseStatusCode, responseBody, durationInMs);
        this.name = "OsmHttpError";
        this.retriable = false;
    }
}