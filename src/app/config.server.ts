import { APP_CONFIG } from "@config";
import type { SearchEngineConfiguration } from "@features/search-engine.server";

export const NOMINATIM_CONFIG = {
  BASE_URL: process.env.BROULETTE_NOMINATIM_URL ?? "https://nominatim.openstreetmap.org/search",
  USER_AGENT: process.env.BROULETTE_NOMINATIM_USER_AGENT ?? `${APP_CONFIG.name}/${APP_CONFIG.version}`,
  BOTTOM_NOTE: process.env.BROULETTE_NOMINATIM_BOTTOM_NOTE ?? "by OpenStreetMap",
  TIMEOUT_IN_MS: Number(process.env.BROULETTE_NOMINATIM_API_TIMEOUT || 5000)
};

export const PHOTON_CONFIG = {
  BASE_URL: process.env.BROULETTE_PHOTON_BOTTOM_NOTE ?? "https://photon.komoot.io/api/",
  BOTTOM_NOTE: process.env.BROULETTE_PHOTON_BOTTOM_NOTE ?? "by Photon",
  TIMEOUT_IN_MS: Number(process.env.BROULETTE_PHOTON_API_TIMEOUT || 5000)
};

export const GOOGLE_PLACE_SOURCE_NAME = "google_place";
export const OVERPASS_SOURCE_NAME = "osm";

export const RESTAURANT_TYPES_TO_EXCLUDE: string[] = [
  "restaurant",
  "establishment",
  "point_of_interest",
  "food",
];

export const SEARCH_ENGINE_CONFIGURATION: SearchEngineConfiguration = {
  discovery: {
    overpass: {
      instanceUrl: process.env.BROULETTE_OVERPASS_API_INSTANCE_URL || "https://overpass-api.de/api/interpreter",
      timeoutInSeconds: Number(process.env.BROULETTE_OVERPASS_API_TIMEOUT || 10)
    } as const,
    initialDiscoveryRangeMeters: Number(process.env.BROULETTE_ENGINE_DEFAULT_INITIAL_DISCOVERY_RANGE_METERS ?? 5000),
    discoveryRangeIncreaseMeters: Number(process.env.BROULETTE_ENGINE_DEFAULT_DISCOVERY_RANGE_INCREASE_METERS ?? 3000),
    maxDiscoveryIterations: Number(process.env.BROULETTE_ENGINE_DEFAULT_MAX_DISCOVERY_ITERATIONS ?? 3)
  },
  matching: {
    tags: {
      hiddenTags: process.env.BROULETTE_TAGS_TO_EXCLUDE?.split(',')?.map(tag => tag.trim()) || RESTAURANT_TYPES_TO_EXCLUDE,
      priorityTags: process.env.BROULETTE_TAGS_TO_PRIORITIZE?.split(',')?.map(tag => tag.trim()) || [],
      maxTags: Number(process.env.BROULETTE_TAGS_MAXIMUM || 10)
    },
    google: {
      enabled: process.env.BROULETTE_GOOGLE_PLACE_ENABLED?.toLowerCase() === "true",
      apiKey: process.env.BROULETTE_GOOGLE_PLACE_API_KEY,
      rateLimiting: {
        maxNumberOfAttemptsPerMonth: Number(process.env.BROULETTE_MAX_NUMBER_OF_ATTEMPTS_PER_MONTH || 200),
      },
      search: {
        radiusInMeters: Number(process.env.BROULETTE_GOOGLE_SEARCH_RADIUS_IN_METERS || 50)
      },
      failover: {
        retry: Number(process.env.BROULETTE_GOOGLE_RETRY || 3),
        timeoutInSeconds: Number(process.env.BROULETTE_GOOGLE_PLACE_API_TIMEOUT_IN_SECONDS || 10),
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
        maxDistanceInMeters: Number(process.env.BROULETTE_GOOGLE_SEARCH_RADIUS_IN_METERS || 50)
      }
    }
  }
}

export const SERVER_CONFIG = {
  nominatim: NOMINATIM_CONFIG,
  photon: PHOTON_CONFIG,
  search: SEARCH_ENGINE_CONFIGURATION
} as const;
