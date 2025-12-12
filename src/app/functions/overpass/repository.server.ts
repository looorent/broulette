import { createCircuitBreaker } from "../circuit-breaker/circuit-breaker.server";
import { OsmEmptyResponseError, OsmHttpError, OsmServerError } from "./error.server";
import { OverpassResponse, OverpassRestaurant } from "./types.server";

const OVERPASS_API_INSTANCE_URL = import.meta.env.VITE_OVERPASS_API_INSTANCE_URL || "https://overpass-api.de/api/interpreter";
const OVERPASS_API_TIMEOUT_IN_SECONDS = import.meta.env.VITE_OVERPASS_API_TIMEOUT_IN_SECONDS || 5000;

function createQueryToListAllRestaurantsNearby(
  latitude: number,
  longitude: number,
  distanceRangeInMeters: number,
  idsToExclude: { osmId: string; osmType: string }[],
  timeoutInSeconds: number = OVERPASS_API_TIMEOUT_IN_SECONDS
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

export async function fetchAllRestaurantsNearby(
  latitude: number,
  longitude: number,
  distanceRangeInMeters: number,
  idsToExclude: { osmId: string; osmType: string }[],
  timeoutInSeconds: number = OVERPASS_API_TIMEOUT_IN_SECONDS
): Promise<OverpassResponse | undefined> {
  console.info(
    `[OSM] Fetching all OSM restaurants nearby '${latitude},${longitude}'...`
  );
  const query = createQueryToListAllRestaurantsNearby(latitude, longitude, distanceRangeInMeters, idsToExclude, timeoutInSeconds);
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
      `[OSM] Fetching all OSM restaurants nearby '${latitude},${longitude}': done in ${durationInMs} ms.`
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

export async function fetchAllRestaurantsNearbyWithRetry(
  latitude: number,
  longitude: number,
  distanceRangeInMeters: number,
  idsToExclude: { osmId: string; osmType: string }[],
  timeoutInSeconds: number = OVERPASS_API_TIMEOUT_IN_SECONDS
): Promise<OverpassResponse | undefined> {
  return await createCircuitBreaker(() =>
    fetchAllRestaurantsNearby(latitude, longitude, distanceRangeInMeters, idsToExclude, timeoutInSeconds)
  );
}

export function parseOverpassId(id: string): number | undefined {
  if (!/^\d+$/.test(id)) {
    return undefined;
  } else {
    const parsed = parseInt(id, 10);
    return isNaN(parsed) ? undefined : parsed;
  }
}
