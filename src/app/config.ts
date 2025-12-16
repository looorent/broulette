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
  "restaurant",
  "establishment",
  "point_of_interest",
  "food",
];

export const DEFAULT_SEARCH_ENGINE_CONFIGURATION: SearchEngineConfiguration = {
  discovery: {
    overpass: {
      instanceUrl: import.meta.env.VITE_OVERPASS_API_INSTANCE_URL || "https://overpass-api.de/api/interpreter",
      timeoutInSeconds: import.meta.env.VITE_OVERPASS_API_TIMEOUT || 10
    },
    initialDiscoveryRangeMeters: Number(import.meta.env.VITE_ENGINE_DEFAULT_INITIAL_DISCOVERY_RANGE_METERS ?? 5000),
    discoveryRangeIncreaseMeters: Number(import.meta.env.VITE_ENGINE_DEFAULT_DISCOVERY_RANGE_INCREASE_METERS ?? 3000),
    maxDiscoveryIterations: Number(import.meta.env.VITE_ENGINE_DEFAULT_MAX_DISCOVERY_ITERATIONS ?? 3)
  },
  matching: {
    tags: {
      hiddenTags: import.meta.env.VITE_TAGS_TO_EXCLUDE?.split(',')?.map((tag: string) => tag.trim()) || RESTAURANT_TYPES_TO_EXCLUDE,
      priorityTags: import.meta.env.VITE_TAGS_TO_PRIORITIZE?.split(',')?.map((tag: string) => tag.trim()) || [],
      maxTags: Number(import.meta.env.VITE_TAGS_MAXIMUM || 10)
    },
    google: {
      enabled: import.meta.env.VITE_GOOGLE_PLACE_ENABLED?.toLowerCase() === "true",
      apiKey: import.meta.env.VITE_GOOGLE_PLACE_API_KEY,
      rateLimiting: {
        maxNumberOfAttemptsPerMonth: Number(import.meta.env.VITE_MAX_NUMBER_OF_ATTEMPTS_PER_MONTH || 200),
      },
      search: {
        radiusInMeters: Number(import.meta.env.VITE_GOOGLE_SEARCH_RADIUS_IN_METERS || 50)
      },
      failover: {
        retry: Number(import.meta.env.VITE_GOOGLE_RETRY || 3),
        timeoutInSeconds: Number(import.meta.env.VITE_GOOGLE_PLACE_API_TIMEOUT_IN_SECONDS || 10),
      },
      photo: {
        maxWidthInPx: 1024,
        maxHeightInPx: 512
      },
      similarity: {
        weight: {
          name: 0.4,
          location: 0.6
        },
        maxDistanceInMeters: Number(import.meta.env.VITE_GOOGLE_SEARCH_RADIUS_IN_METERS || 50)
      }
    }
  }
}
