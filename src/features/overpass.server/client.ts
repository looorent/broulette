import type { FailoverConfiguration } from "@features/circuit-breaker.server";

import { overpassCircuitBreaker } from "./circuit-breaker";
import { OsmEmptyResponseError, OsmError, OsmHttpError, OsmServerError } from "./error";
import type { OverpassResponse, OverpassRestaurant } from "./types";

export async function fetchAllRestaurantsNearbyWithRetry(
  latitude: number,
  longitude: number,
  distanceRangeInMeters: number,
  instanceUrl: string,
  timeoutInSeconds: number,
  idsToExclude: { osmId: string; osmType: string }[],
  failoverConfiguration: FailoverConfiguration,
  signal?: AbortSignal | undefined
): Promise<OverpassResponse | undefined> {
  console.log(`[OSM] fetchAllRestaurantsNearbyWithRetry: Requesting restaurants near [${latitude}, ${longitude}] (radius: ${distanceRangeInMeters}m)`);

  return await (await overpassCircuitBreaker(instanceUrl, failoverConfiguration)).execute(async combinedSignal => {
    if (combinedSignal?.aborted) {
      throw combinedSignal.reason;
    }
    return fetchAllRestaurantsNearby(latitude, longitude, distanceRangeInMeters, idsToExclude, instanceUrl, timeoutInSeconds, combinedSignal);
  }, signal);
}

async function fetchAllRestaurantsNearby(
  latitude: number,
  longitude: number,
  distanceRangeInMeters: number,
  idsToExclude: { osmId: string; osmType: string }[],
  instanceUrl: string,
  timeoutInSeconds: number,
  signal: AbortSignal
): Promise<OverpassResponse | undefined> {
  console.trace(`[OSM] fetchAllRestaurantsNearby: Building query with ${idsToExclude.length} exclusions...`);
  const query = createQueryToListAllRestaurantsNearby(latitude, longitude, distanceRangeInMeters, idsToExclude, timeoutInSeconds);
  const start = Date.now();

  const response = await fetch(instanceUrl, {
    method: "post",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
    },
    body: `data=${encodeURIComponent(query)}`,
    signal: signal
  });

  const durationInMs = Date.now() - start;

  if (response.ok) {
    console.log(`[OSM] fetchAllRestaurantsNearby: Query successful. Duration: ${durationInMs}ms.`);
    const body = await response.json();
    if (body) {
      const parsed = parseResponse(body, durationInMs);
      console.log(`[OSM] fetchAllRestaurantsNearby: Parsed ${parsed?.restaurants.length || 0} restaurants.`);
      return parsed;
    } else {
      throw new OsmEmptyResponseError(
        query,
        response.status,
        await response.text(),
        durationInMs
      );
    }
  } else {
    throw await parseError(query, response, durationInMs);
  }
}

function createQueryToListAllRestaurantsNearby(
  latitude: number,
  longitude: number,
  distanceRangeInMeters: number,
  idsToExclude: { osmId: string; osmType: string }[],
  timeoutInSeconds: number
): string {
  const exclusionQuery = buildExclusionQuery(idsToExclude);
  const exclusionBlock = exclusionQuery
    ? `(${exclusionQuery})->.excludeSet;`
    : "";
  const outputLogic = exclusionQuery
    ? "(.allRestaurants; - .excludeSet;);"
    : ".allRestaurants;";

  return `
    [out:json][timeout:${timeoutInSeconds}];

    (
      nwr["amenity"~"restaurant|fast_food|food_court"]["name"](around:${distanceRangeInMeters}, ${latitude}, ${longitude});
    )->.allRestaurants;

    ${exclusionBlock}

    ${outputLogic}

    out tags center qt;
  `.trim();
}

function buildExclusionQuery(idsToExclude: { osmId: string; osmType: string }[]): string | undefined {
  const nodes = [...new Set(idsToExclude.filter(id => id.osmType === "node").map(id => id.osmId))];
  const ways = [...new Set(idsToExclude.filter(id => id.osmType === "way").map(id => id.osmId))];
  const rels = [...new Set(idsToExclude.filter(id => id.osmType === "relation").map(id => id.osmId))];

  if (nodes.length + ways.length + rels.length > 0) {
    let query = "";
    if (nodes.length > 0) {
      query += `node(id:${nodes.join(",")});`
    }

    if (ways.length > 0) {
      query += `way(id:${ways.join(",")});`
    }

    if (rels.length > 0) {
      query += `rel(id:${rels.join(",")});`
    }

    return query;
  } else {
    return undefined;
  }
}

function parseRestaurantFromResponse(
  body: any
): OverpassRestaurant | undefined {
  const latitude = body?.lat || body?.center?.lat;
  const longitude = body?.lon || body?.center?.lon;
  if (latitude && longitude) {
    const tags = body.tags || [];
    const countryCode = tags["addr:country"];
    const street = tags["addr:street"];
    const houseNumber = tags["addr:housenumber"];
    const city = tags["addr:city"];
    const postCode = tags["addr:postcode"];

    return {
      id: body.id,
      type: body.type,
      name: tags.name,
      latitude: latitude,
      longitude: longitude,
      amenity: tags["amenity"],
      cuisine: tags["cuisine"]?.split(",") || [],
      vegan: tags["diet:vegan"] || undefined,
      vegetarian: tags["diet:vegetarian"] || undefined,
      countryCode: countryCode?.toLowerCase(),
      street: street,
      city: city,
      postCode: postCode,
      phoneNumber: tags["phone"] || tags["contact:phone"],
      addressState: tags["state"] || tags["addr:state"],
      formattedAddress: createFormattedAddress(street, houseNumber, city, postCode, countryCode),
      website: tags["website"] || tags["contact:website"] || tags["contact:facebook"] || tags["url"],
      openingHours: tags["opening_hours"],
      description: tags["description"],
      imageUrl: tags["image"] || tags["mapillary"],
      openStreetMapUrl: buildOpenStreetMapUrl(body.id, body.type),
      operational: true // otherwise Overpass would not return it with the requested
    }
  } else {
    return undefined;
  }
}

function parseResponse(
  body: any,
  durationInMs: number
): OverpassResponse | undefined {
  if (body) {
    return {
      generator: body.generator,
      version: body.version,
      copyright: body.osm3s?.copyright,
      timestampInUtc: body.osm3s?.timestamp_osm_base,
      durationInMs: durationInMs,
      restaurants: body.elements?.map(parseRestaurantFromResponse)?.filter(Boolean) || []
    };
  } else {
    return undefined;
  }
}

const EURO_CODES = ["be", "fr", "de", "nl", "es", "it", "at", "ch", "pl", "dk", "no", "se", "fi"];
function createFormattedAddress(
  street?: string,
  houseNumber?: string,
  city?: string,
  postCode?: string,
  countryCode?: string
): string | undefined {
  if (!street && !city && !postCode) {
    return undefined;
  } else {
    const cleanStreet = street?.trim() || "";
    const cleanHouseNumber = houseNumber?.trim() || "";
    const cleanCity = city?.trim() || "";
    const cleanPostCode = postCode?.trim() || "";
    const code = countryCode?.toLowerCase()?.trim();
    const isEuroStyle = EURO_CODES.includes(code || "");
    if (isEuroStyle) {
      const cityPart = [cleanPostCode, cleanCity].filter(Boolean).join(" ");
      return [cleanStreet, cleanHouseNumber, cityPart].filter(Boolean).join(", ");
    } else {
      const locationPart = [cleanCity, cleanPostCode].filter(Boolean).join(" ");
      return [cleanStreet, cleanHouseNumber, locationPart].filter(Boolean).join(", ");
    }
  }
}

function buildOpenStreetMapUrl(id: string, type: string): string {
  return `https://www.openstreetmap.org/${type}/${id}`;
}

async function parseError(query: string, response: Response, durationInMs: number): Promise<OsmError> {
  const body = await response.text();
  console.error(`[OSM] Request failed after ${durationInMs}ms. Status: ${response.status}.`);

  if (response.status >= 500) {
    return new OsmServerError(
      query,
      response.status,
      body,
      durationInMs
    );
  } else {
    return new OsmHttpError(
      query,
      response.status,
      body,
      durationInMs
    );
  }
}
