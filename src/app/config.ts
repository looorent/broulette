export const APP_CONFIG = {
  name: "BiteRoulette",
  version: "0.0.1",
  privacy: {
    updatedAt: "December 7, 2025",
    contactEmail: "hello@biteroulette.com"
  }
} as const;

export const NOMINATIM_CONFIG = {
  BASE_URL: import.meta.env.VITE_NOMINATIM_URL ?? "https://nominatim.openstreetmap.org/search",
  USER_AGENT: import.meta.env.VITE_NOMINATIM_USER_AGENT ?? `${APP_CONFIG.name}/${APP_CONFIG.version}`,
  BOTTOM_NOTE: import.meta.env.VITE_NOMINATIM_BOTTOM_NOTE ?? "by OpenStreetMap",
  TIMEOUT_IN_MS: Number(import.meta.env.VITE_NOMINATIM_API_TIMEOUT) || 5000
};

export const PHOTON_CONFIG = {
  BASE_URL: import.meta.env.VITE_PHOTON_BOTTOM_NOTE ?? "https://photon.komoot.io/api/",
  BOTTOM_NOTE: import.meta.env.VITE_PHOTON_BOTTOM_NOTE ?? "by Photon",
  TIMEOUT_IN_MS: Number(import.meta.env.VITE_PHOTON_API_TIMEOUT || 5000)
};

export const GOOGLE_PLACE_SOURCE_NAME = "google_place";
export const OVERPASS_SOURCE_NAME = "osm";

export const DEFAULT_ENRICHMENT_CONFIGURATION = {
  google: {
    source: GOOGLE_PLACE_SOURCE_NAME,
    searchRadiusInMeters: Number(import.meta.env.VITE_GOOGLE_SEARCH_RADIUS_IN_METERS || 50)
  },
  osm: {
    source: OVERPASS_SOURCE_NAME
  }
}
