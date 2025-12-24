import type { LocationPreference, LocationSuggestions } from "@features/search";
import { nomatimCircuitBreaker } from "./circuit-breaker";
import { NominatimError, NominatimHttpError, NominatimServerError } from "./error";
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

export async function fetchLocationFromNominatim(
  query: string,
  instanceUrl: string = DEFAULT_NOMINATIM_CONFIGURATION.instanceUrls[0],
  configuration: NominatimConfiguration = DEFAULT_NOMINATIM_CONFIGURATION,
  signal?: AbortSignal | undefined
): Promise<LocationSuggestions> {
  const rawData = await nomatimCircuitBreaker(instanceUrl).execute(async ({ signal: combinedSignal }) => {
    if (combinedSignal?.aborted) {
      throw combinedSignal.reason
    };
    return fetchNominatimAddresses(query, instanceUrl, configuration.maxNumberOfAddresses, configuration.userAgent, combinedSignal);
  }, signal);

  const locations = rawData
    .filter((item) => item && item.lat && item.lon)
    .map(convertNominatimToLocation);

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

async function fetchNominatimAddresses(
  query: string,
  instanceUrl: string,
  maxNumberOfAddresses: number,
  userAgent: string,
  signal: AbortSignal | undefined
): Promise<NominatimPlace[]> {
  console.info(`[Photon] Finding addresses for query='${query}'...`);
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
    console.info(`[Nominatim] Finding addresses for query='${query}'. Done in ${durationInMs}ms.`);
    const body = (await response.json()) as NominatimPlace[];
    return body.filter(address => APPROXIMATE_LOCATION_CLASSES.has(address.class) && !EXCLUDED_TYPES.has(address.type));
  } else {
    throw await parseError(url, response, durationInMs);
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

async function parseError(url: string, response: Response, durationInMs: number): Promise<NominatimError> {
  const body = await response.text();
  if (response.status >= 500) {
    return new NominatimServerError(
      url,
      response.status,
      body,
      durationInMs
    );
  } else {
    return new NominatimHttpError(
      url,
      response.status,
      body,
      durationInMs
    );
  }
}
