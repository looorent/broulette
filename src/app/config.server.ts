import { APP_CONFIG } from "@config";
import type { GeocodingProviderConfiguration } from "@features/address.server";
import type { GooglePlaceConfiguration } from "@features/google.server";
import type { GeocodingNominatimConfiguration } from "@features/nominatim.server";
import type { GeocodingPhotonConfiguration } from "@features/photon.server";
import type { SearchEngineConfiguration } from "@features/search-engine.server";

export const NOMINATIM_CONFIG: GeocodingNominatimConfiguration = {
  baseUrl: process.env.BROULETTE_NOMINATIM_URL ?? "https://nominatim.openstreetmap.org/search",
  userAgent: process.env.BROULETTE_NOMINATIM_USER_AGENT ?? `${APP_CONFIG.name}/${APP_CONFIG.version}`,
  bottomNote: process.env.BROULETTE_NOMINATIM_BOTTOM_NOTE ?? "by OpenStreetMap",
  maxNumberOfAddresses: Number(process.env.BROULETTE_NOMINATIM_NUMBER_0F_ADDRESSES || 5),
  failover: {
    retries: Number(process.env.BROULETTE_NOMINATIM_API_RETRIES || 3),
    intervalBetweenRetriesInMs: Number(process.env.BROULETTE_NOMINATIM_API_TIMEOUT || 2_000),
    timeoutInMs: Number(process.env.BROULETTE_NOMINATIM_API_TIMEOUT || 5000)
  }
};

export const PHOTON_CONFIG: GeocodingPhotonConfiguration = {
  baseUrl: process.env.BROULETTE_PHOTON_BOTTOM_NOTE ?? "https://photon.komoot.io/api/",
  bottomNote: process.env.BROULETTE_PHOTON_BOTTOM_NOTE ?? "by Photon",
  maxNumberOfAddresses: Number(process.env.BROULETTE_PHOTON_NUMBER_0F_ADDRESSES || 5),
  failover: {
    retries: Number(process.env.BROULETTE_PHOTON_API_RETRIES || 3),
    intervalBetweenRetriesInMs: Number(process.env.BROULETTE_NOMINATIM_API_TIMEOUT || 2_000),
    timeoutInMs: Number(process.env.BROULETTE_PHOTON_API_TIMEOUT || 5000)
  }
};

export const GEOCODING_CONFIGURATION: GeocodingProviderConfiguration = {
  nominatim: NOMINATIM_CONFIG,
  photon: PHOTON_CONFIG,
  providerSwitchDelay: 300
}

// TODO they should not be there
export const GOOGLE_PLACE_SOURCE_NAME = "google_place";
export const OVERPASS_SOURCE_NAME = "osm";

export const RESTAURANT_TYPES_TO_EXCLUDE: string[] = [
  "restaurant",
  "establishment",
  "point_of_interest",
  "food",
];

export const GOOGLE_PLACE_CONFIGURATION: GooglePlaceConfiguration = {
  apiKey: process.env.BROULETTE_GOOGLE_PLACE_API_KEY ?? "",
  rateLimiting: {
    maxNumberOfAttemptsPerMonth: Number(process.env.BROULETTE_MAX_NUMBER_OF_ATTEMPTS_PER_MONTH || 200),
  },
  search: {
    radiusInMeters: Number(process.env.BROULETTE_GOOGLE_SEARCH_RADIUS_IN_METERS || 50)
  },
  failover: {
    retries: Number(process.env.BROULETTE_GOOGLE_PLACE_API_RETRY || 3),
    intervalBetweenRetriesInMs: Number(process.env.BROULETTE_GOOGLE_PLACE_API_RETRY_INTERVAL || 2_000),
    timeoutInMs: Number(process.env.BROULETTE_GOOGLE_PLACE_API_TIMEOUT_IN_SECONDS || 10_000),
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
};

export const SEARCH_ENGINE_CONFIGURATION: SearchEngineConfiguration = {
  discovery: {
    overpass: {
      instanceUrls: [process.env.BROULETTE_OVERPASS_API_INSTANCE_URL || "https://overpass-api.de/api/interpreter"], // TODO parse env
      failover: {
        retries: Number(process.env.BROULETTE_OVERPASS_API_RETRIES || 3),
        intervalBetweenRetriesInMs: Number(process.env.BROULETTE_OVERPASS_API_TIMEOUT || 2_000),
        timeoutInMs: Number(process.env.BROULETTE_OVERPASS_API_TIMEOUT || 5000)
      }
    },
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
    google: GOOGLE_PLACE_CONFIGURATION
  }
}

export const SERVER_CONFIG = {
  geocoding: GEOCODING_CONFIGURATION,
  search: SEARCH_ENGINE_CONFIGURATION
} as const;
