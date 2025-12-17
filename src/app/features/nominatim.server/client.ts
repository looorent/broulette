import type { LocationPreference, LocationSuggestions } from "@features/search";
import { nomatimCircuitBreaker } from "./circuit-breaker";
import { NominatimHttpError, NominatimServerError } from "./error";
import { DEFAULT_CONFIGURATION, type GeocodingNominatimConfiguration } from "./types";

interface NominatimPlace {
  place_id: number;
  name: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
}

export async function fetchLocationFromNominatim(
  query: string,
  instanceUrl: string = DEFAULT_CONFIGURATION.instanceUrls[0],
  configuration: GeocodingNominatimConfiguration = DEFAULT_CONFIGURATION,
  signal?: AbortSignal | undefined
): Promise<LocationSuggestions> {
  const rawData = await nomatimCircuitBreaker(instanceUrl).execute(async ({ signal: combinedSignal }) => {
    if (signal?.aborted) {
      throw signal.reason
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

async function fetchNominatimAddresses(
  query: string,
  instanceUrl: string,
  maxNumberOfAddresses: number,
  userAgent: string,
  signal: AbortSignal | undefined
): Promise<NominatimPlace[]> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: maxNumberOfAddresses.toString(),
    addressdetails: "1",
    extratags: "0",
    namedetails: "0",
    polygon_geojson: "0",
    bounded: "0",
  });

  const url = `${instanceUrl}?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": userAgent,
      "Accept": "application/json"
    },
    signal: signal
  });

  if (response.ok) {
    return response.json();
  } else if (response.status >= 500) {
    throw new NominatimServerError(response.status);
  } else {
    throw new NominatimHttpError(response.status);
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
