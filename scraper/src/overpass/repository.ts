import { createCircuitBreaker } from "../circuit_breaker/circuit_breaker";
import { OsmEmptyResponseError, OsmHttpError, OsmServerError } from "./error";
import { OverpassResponse, OverpassRestaurant } from "./types";

const OVERPASS_API_INSTANCE_URL =
  process.env["OVERPASS_API_INSTANCE_URL"] ||
  "https://overpass-api.de/api/interpreter";

function createQueryToListAllRestaurantsInCountry(
  countryCodeInIso3166: string,
  timeoutInSeconds: number
): string {
  return `
        [out:json][timeout:${timeoutInSeconds}];
        area["ISO3166-1"="${countryCodeInIso3166}"]->.searchArea;
        nwr["amenity"~"restaurant|fast_food"](area.searchArea);
        out tags center qt;
    `.trim();
}

function parseRestaurantFromResponse(
  body: any
): OverpassRestaurant | undefined {
  if (body) {
    return new OverpassRestaurant(
      body.id,
      body.type,
      body.tags?.name,
      body.lat || body.center?.lat || 0,
      body.lon || body.center?.lon || 0,
      body.tags || {},
      body.tags?.amenity
    );
  } else {
    return undefined;
  }
}

function parseResponse(
  body: any,
  durationInMs: number
): OverpassResponse | undefined {
  if (body) {
    return new OverpassResponse(
      body.generator,
      body.version,
      body.osm3s?.copyright,
      body.osm3s?.timestamp_osm_base,
      durationInMs,
      body.elements?.map(parseRestaurantFromResponse)?.filter(Boolean) || [],
      body
    );
  } else {
    return undefined;
  }
}

export async function fetchAllRestaurantsInCountry(
  countryCodeInIso3166: string,
  timeoutInSeconds: number
): Promise<OverpassResponse | undefined> {
  console.info(
    `[OSM] Fetching all OSM restaurants in country '${countryCodeInIso3166}'...`
  );
  const query = createQueryToListAllRestaurantsInCountry(
    countryCodeInIso3166,
    timeoutInSeconds
  );
  const start = Date.now();
  const response = await fetch(OVERPASS_API_INSTANCE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
    },
    body: `data=${encodeURIComponent(query)}`
  });

  const durationInMs = Date.now() - start;

  if (response.ok) {
    console.info(
      `[OSM] Fetching all OSM restaurants in country '${countryCodeInIso3166}': done in ${durationInMs} ms.`
    );
    const body = (await response.json()) as any;
    if (body) {
      return parseResponse(body, durationInMs);
    } else {
      throw new OsmEmptyResponseError(
        query,
        response.status,
        await response.text(),
        durationInMs
      );
    }
  } else if (response.status >= 500) {
    throw new OsmServerError(
      query,
      response.status,
      await response.text(),
      durationInMs
    );
  } else {
    throw new OsmHttpError(
      query,
      response.status,
      await response.text(),
      durationInMs
    );
  }
}

export async function fetchAllRestaurantsWithRetriesInCountry(
  countryCodeInIso3166: string,
  timeoutInSeconds: number
): Promise<OverpassResponse | undefined> {
  return await createCircuitBreaker(() =>
    fetchAllRestaurantsInCountry(countryCodeInIso3166, timeoutInSeconds)
  );
}
