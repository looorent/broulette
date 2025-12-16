import { NOMINATIM_CONFIG } from "@config/server";
import { createCircuitBreaker } from "@features/circuit-breaker.server";
import type { LocationPreference, LocationSuggestions } from "@features/search";
import { executeRequest } from "@features/http.server";
import { NominatimHttpError, NominatimServerError } from "./error";

interface NominatimPlace {
  place_id: number;
  name: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
}

export async function fetchLocationFromNominatim(query: string, limit: number, signal: AbortSignal): Promise<LocationSuggestions> {
  const rawData = await createCircuitBreaker(() =>
    fetchNominatimAddresses(query, limit, signal)
  );

  const locations = rawData
    .filter((item) => item && item.lat && item.lon)
    .map(convertNominatimToLocation);

  return {
    locations: locations,
    note: NOMINATIM_CONFIG.BOTTOM_NOTE
  };
}

async function fetchNominatimAddresses(query: string, limit: number, signal: AbortSignal): Promise<NominatimPlace[]> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: limit.toString(),
    addressdetails: "1",
    extratags: "0",
    namedetails: "0",
    polygon_geojson: "0",
    bounded: "0",
  });

  const url = `${NOMINATIM_CONFIG.BASE_URL}?${params.toString()}`;

  const response = await executeRequest(url, {
    headers: {
      "User-Agent": NOMINATIM_CONFIG.USER_AGENT,
      "Accept": "application/json"
    }
  },
    NOMINATIM_CONFIG.TIMEOUT_IN_MS,
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
