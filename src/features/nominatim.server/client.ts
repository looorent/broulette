import { circuitBreaker } from "@features/circuit-breaker.server";
import { computeViewportFromCircle, type Coordinates } from "@features/coordinate";
import type { LocationPreference, LocationSuggestions } from "@features/search";
import { logger } from "@features/utils/logger";

import { parseNominatimError } from "./error";
import { DEFAULT_NOMINATIM_CONFIGURATION, type NominatimConfiguration } from "./types";

interface NominatimPlace {
  place_id: number;
  name: string;
  display_name: string;
  class: string;
  type: string;
  lat: string;
  lon: string;
}

const CIRCUIT_BREAKER_NAME_PREFIX = "nominatim";
export async function fetchLocationFromNominatim(
  query: string,
  instanceUrl: string = DEFAULT_NOMINATIM_CONFIGURATION.instanceUrls[0],
  configuration: NominatimConfiguration = DEFAULT_NOMINATIM_CONFIGURATION,
  locationBias?: Coordinates | undefined,
  signal?: AbortSignal | undefined
): Promise<LocationSuggestions> {
  logger.log("[Nominatim] fetchLocationFromNominatim: Processing query='%s' via %s%s", query, instanceUrl, locationBias ? ` with location bias` : "");

  const rawData = await circuitBreaker(`${CIRCUIT_BREAKER_NAME_PREFIX}:${instanceUrl}`, configuration.failover).execute(async combinedSignal => {
    if (combinedSignal?.aborted) {
      throw combinedSignal.reason
    };
    return fetchNominatimAddresses(query, instanceUrl, configuration.maxNumberOfAddresses, configuration.userAgent, locationBias, combinedSignal);
  }, signal);

  const locations = rawData
    .filter((item) => item && item.lat && item.lon)
    .map(convertNominatimToLocation);

  logger.log("[Nominatim] fetchLocationFromNominatim: Returned %d locations for '%s'", locations.length, query);

  return {
    locations: locations,
    note: configuration.bottomNote
  };
}

const APPROXIMATE_LOCATION_CLASSES = new Set([
  "place",
  "boundary",
  "highway"
]);

const EXCLUDED_TYPES = new Set([
  "house",
  "residential"
]);

const VIEWBOX_RADIUS_IN_METERS = 100_000;

async function fetchNominatimAddresses(
  query: string,
  instanceUrl: string,
  maxNumberOfAddresses: number,
  userAgent: string,
  locationBias: Coordinates | undefined,
  signal: AbortSignal | undefined
): Promise<NominatimPlace[]> {
  logger.log("[Nominatim] fetchNominatimAddresses: Querying API with q='%s'%s...", query, locationBias ? ` near (${locationBias.latitude}, ${locationBias.longitude})` : "");
  const start = Date.now();
  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: maxNumberOfAddresses.toString(),
    addressdetails: "1",
    extratags: "0",
    namedetails: "0",
    polygon_geojson: "0",
    bounded: "0",
    dedupe: "1",
    layer: "address"
  });

  if (locationBias) {
    const viewport = computeViewportFromCircle(locationBias, VIEWBOX_RADIUS_IN_METERS);
    params.set("viewbox", `${viewport.bottomLeft.longitude},${viewport.bottomLeft.latitude},${viewport.topRight.longitude},${viewport.topRight.latitude}`);
  }

  const url = `${instanceUrl}?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": userAgent,
      "Accept": "application/json"
    },
    signal: signal
  });

  const durationInMs = Date.now() - start;
  if (response.ok) {
    const body = (await response.json()) as NominatimPlace[];

    const filtered = body.filter(address => APPROXIMATE_LOCATION_CLASSES.has(address.class) && !EXCLUDED_TYPES.has(address.type));

    logger.log("[Nominatim] fetchNominatimAddresses: Success in %dms. Raw results: %d. Filtered results: %d.", durationInMs, body.length, filtered.length);

    return filtered;
  } else {
    throw await parseNominatimError(url, response, durationInMs);
  }
}

function convertNominatimToLocation(place: NominatimPlace): LocationPreference {
  return {
    label: {
      display: place.display_name,
      compact: place.name || place.display_name.split(',')[0]
    },
    coordinates: {
      latitude: Number(place.lat),
      longitude: Number(place.lon)
    },
    isDeviceLocation: false
  };
}

