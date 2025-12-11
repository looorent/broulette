import type { LocationPreference, LocationSuggestions } from "~/types/location";
import { executeRequest } from "../http-client";
import { APP_CONFIG } from "~/config";

const NOMINATIM_CONFIG = {
  BASE_URL: import.meta.env.VITE_NOMINATIM_URL ?? "https://nominatim.openstreetmap.org/search",
  USER_AGENT: import.meta.env.VITE_NOMINATIM_USER_AGENT ?? `${APP_CONFIG.name}/${APP_CONFIG.version}`,
  BOTTOM_NOTE: import.meta.env.VITE_NOMINATIM_BOTTOM_NOTE ?? "by OpenStreetMap",
  TIMEOUT_IN_MS: Number(import.meta.env.VITE_NOMINATIM_API_TIMEOUT) || 5000
};

interface NominatimPlace {
  place_id: number;
  name: string;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
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
    }},
    NOMINATIM_CONFIG.TIMEOUT_IN_MS,
    signal
  );

  return response.json();
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

export async function fetchLocationFromNominatim(query: string, limit: number, signal: AbortSignal): Promise<LocationSuggestions> {
  const rawData = await fetchNominatimAddresses(query, limit, signal);
  const locations = rawData
    .filter((item) => item && item.lat && item.lon)
    .map(convertNominatimToLocation);

  return {
    locations: locations,
    note: NOMINATIM_CONFIG.BOTTOM_NOTE
  };
}
