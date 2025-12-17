import { overpassCircuitBreaker } from "./circuit-breaker";
import { OsmEmptyResponseError, OsmHttpError, OsmServerError } from "./error";
import type { OverpassResponse, OverpassRestaurant } from "./types";

export async function fetchAllRestaurantsNearbyWithRetry(
  latitude: number,
  longitude: number,
  distanceRangeInMeters: number,
  instanceUrl: string,
  timeoutInSeconds: number,
  idsToExclude: { osmId: string; osmType: string }[],
  signal?: AbortSignal | undefined
): Promise<OverpassResponse | undefined> {
  return await overpassCircuitBreaker(instanceUrl).execute(async ({ signal: combinedSignal }) => {
    if (signal?.aborted) {
      throw signal.reason;
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
  console.info(`[OSM] Fetching all OSM restaurants nearby '${latitude},${longitude}'...`);
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
    console.info(`[OSM] Fetching all OSM restaurants nearby '${latitude},${longitude}': done in ${durationInMs} ms.`);

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
      nwr["amenity"~"restaurant|fast_food"]["name"](around:${distanceRangeInMeters}, ${latitude}, ${longitude});
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
    const countryCode = body.tags["addr:country"];
    const street = body.tags["addr:street"];
    const houseNumber = body.tags["addr:housenumber"];
    const city = body.tags["addr:city"];
    const postCode = body.tags["addr:postcode"];

    return {
      id: body.id,
      type: body.type,
      name: body.tags?.name,
      location: {
        latitude: latitude,
        longitude: longitude
      },
      tags: body.tags || [],
      amenity: body.tags["amenity"],
      cuisine: body.tags["cuisine"],
      countryCode: countryCode?.toLowerCase(),
      street: street,
      city: city,
      postCode: postCode,
      phoneNumber: body.tags["phone"],
      addressState: body.tags["state"],
      formattedAddress: createFormattedAddress(street, houseNumber, city, postCode, countryCode),
      website: body.tags["website"] ?? body.tags["contact:facebook"],
      openingHours: body.tags["opening_hours"],
      description: body.tags["description"]
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
