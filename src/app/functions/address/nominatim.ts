import type { LocationPreference, LocationSuggestions } from "~/types/location";
import { executeRequest } from "../http-client";

// TODO use env variables
const NOMINATIM_CONFIG = {
  BASE_URL: "https://nominatim.openstreetmap.org/search",
  USER_AGENT: "BiteRoulette/1.0", // TODO Replace with real contact info
  NOTE: "by OpenStreetMap",
  TIMEOUT_IN_MS: 5000
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
    note: NOMINATIM_CONFIG.NOTE
  };
}
