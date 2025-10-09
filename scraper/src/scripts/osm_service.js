const OVERPASS_API_INSTANCE_URL = "https://overpass-api.de/api/interpreter";

// TODO Lorent add a method to fetch using a circuit breaker

export async function fetchAllRestaurantsInCountry(countryCodeInIso3166) {
    console.info(`Fetching all OSM restaurants in country '${countryCodeInIso3166}'...`);
    const start = Date.now();
    const query = `
        [out:json][timeout:180];
        area["ISO3166-1"="${countryCodeInIso3166}"]->.searchArea;
        nwr["amenity"~"restaurant|fast_food"](area.searchArea);
        out tags center qt;
    `;
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
            restaurants: body.elements
        };
    } else {
        const errorMessage = `HTTP error when fetching the restaurants from OSM! Status: ${response.status} with body: ${await response.text()}`;
        console.error(`Fetching all OSM restaurants in country '${countryCodeInIso3166}': failed after ${durationInMs} ms  with error message ${errorMessage}`);
        throw new Error(errorMessage);
    }
}