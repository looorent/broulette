import type { SearchEngineConfiguration } from "@features/search-engine.server";

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

export const RESTAURANT_TYPES_TO_EXCLUDE: string[] = [
  "restaurant"
];

export const DEFAULT_SEARCH_ENGINE_CONFIGURATION: SearchEngineConfiguration = {
  tags: {
    toExclude: import.meta.env.VITE_TAGS_TO_EXCLUDE?.split(',')?.map((tag: string) => tag.trim()) || RESTAURANT_TYPES_TO_EXCLUDE
  },
  discovery: {
    initialDiscoveryRangeMeters: Number(import.meta.env.VITE_ENGINE_DEFAULT_INITIAL_DISCOVERY_RANGE_METERS ?? 5000),
    discoveryRangeIncreaseMeters: Number(import.meta.env.VITE_ENGINE_DEFAULT_DISCOVERY_RANGE_INCREASE_METERS ?? 3000),
    maxDiscoveryIterations: Number(import.meta.env.VITE_ENGINE_DEFAULT_MAX_DISCOVERY_ITERATIONS ?? 3)
  },
  matching: {
    google: {
      enabled: import.meta.env.VITE_GOOGLE_PLACE_ENABLED?.toLowerCase() === "true",
      apiKey: import.meta.env.VITE_GOOGLE_PLACE_API_KEY,
      searchRadiusInMeters: Number(import.meta.env.VITE_GOOGLE_SEARCH_RADIUS_IN_METERS || 50),
      maxNumberOfAttemptsPerMonth: Number(import.meta.env.VITE_MAX_NUMBER_OF_ATTEMPTS_PER_MONTH || 200),
      retry: Number(import.meta.env.VITE_GOOGLE_RETRY || 3),
      timeOutInMilliseconds: Number(import.meta.env.VITE_GOOGLE_PLACE_API_TIMEOUT_IN_SECONDS || 10000)
    }
  }
}
