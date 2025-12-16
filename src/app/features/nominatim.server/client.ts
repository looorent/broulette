import { createCircuitBreaker } from "@features/circuit-breaker.server";
import { executeRequest } from "@features/http.server";
import type { LocationPreference, LocationSuggestions } from "@features/search";
import { NominatimHttpError, NominatimServerError } from "./error";
import type { GeocodingNominatimConfiguration } from "./types";

interface NominatimPlace {
  place_id: number;
  name: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
}

export async function fetchLocationFromNominatim(query: string, configuration: GeocodingNominatimConfiguration, signal: AbortSignal): Promise<LocationSuggestions> {
  const rawData = await createCircuitBreaker(
    () => fetchNominatimAddresses(query, configuration, signal),
    configuration.failover.retries,
    configuration.failover.timeoutInMs
  );

  const locations = rawData
    .filter((item) => item && item.lat && item.lon)
    .map(convertNominatimToLocation);

  return {
    locations: locations,
    note: configuration.bottomNote
  };
}

async function fetchNominatimAddresses(query: string, configuration: GeocodingNominatimConfiguration, signal: AbortSignal): Promise<NominatimPlace[]> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: configuration.maxNumberOfAddresses.toString(),
    addressdetails: "1",
    extratags: "0",
    namedetails: "0",
    polygon_geojson: "0",
    bounded: "0",
  });

  const url = `${configuration.baseUrl}?${params.toString()}`;

  const response = await executeRequest(url, {
    headers: {
      "User-Agent": configuration.userAgent,
      "Accept": "application/json"
    }
  },
    configuration.timeoutInMs,
    signal
  );

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
      compact: place.name || place.display_name.split(',')[0] // Fallback if name is empty
    },
    coordinates: {
      latitude: Number(place.lat),
      longitude: Number(place.lon)
    },
    isDeviceLocation: false
  };
}
