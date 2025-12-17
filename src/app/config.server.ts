import type { GeocodingProviderConfiguration } from "@features/address.server";
import type { FailoverConfiguration } from "@features/circuit-breaker.server";
import { initializeGooglePlace, type GooglePlaceConfiguration } from "@features/google.server";
import { initializeNominatim, type GeocodingNominatimConfiguration } from "@features/nominatim.server";
import { initializeOverpass, type OverpassConfiguration } from "@features/overpass.server";
import { initializePhoton, type GeocodingPhotonConfiguration } from "@features/photon.server";
import type { SearchEngineConfiguration } from "@features/search-engine.server";

export const APP_CONFIG = {
  name: "BiteRoulette",
  version: "0.0.1",
  privacy: {
    updatedAt: "December 7, 2025",
    contactEmail: "hello@biteroulette.com"
  }
} as const;

export type AppConfiguration = typeof APP_CONFIG;

export const NOMINATIM_CONFIG: GeocodingNominatimConfiguration = {
  baseUrl: process.env.BROULETTE_NOMINATIM_URL ?? "https://nominatim.openstreetmap.org/search",
  userAgent: process.env.BROULETTE_NOMINATIM_USER_AGENT ?? `${APP_CONFIG.name}/${APP_CONFIG.version}`,
  bottomNote: process.env.BROULETTE_NOMINATIM_BOTTOM_NOTE ?? "by OpenStreetMap",
  maxNumberOfAddresses: Number(process.env.BROULETTE_NOMINATIM_NUMBER_0F_ADDRESSES || 5)
};

export const NOMINATIM_FAILOVER_CONFIG: FailoverConfiguration = {
  retry: Number(process.env.BROULETTE_NOMINATIM_API_RETRIES || 3),
  halfOpenAfterInMs: Number(process.env.BROULETTE_NOMINATIM_API_TIMEOUT || 5_000),
  closeAfterNumberOfFailures: Number(process.env.BROULETTE_NOMINATIM_API_CLOSE_AFTER || 5),
  timeoutInMs: Number(process.env.BROULETTE_NOMINATIM_API_TIMEOUT || 5000)
};

export const PHOTON_CONFIG: GeocodingPhotonConfiguration = {
  baseUrl: process.env.BROULETTE_PHOTON_BOTTOM_NOTE ?? "https://photon.komoot.io/api/",
  bottomNote: process.env.BROULETTE_PHOTON_BOTTOM_NOTE ?? "by Photon",
  maxNumberOfAddresses: Number(process.env.BROULETTE_PHOTON_NUMBER_0F_ADDRESSES || 5),
};

export const PHOTON_FAILOVER_CONFIG: FailoverConfiguration = {
  retry: Number(process.env.BROULETTE_PHOTON_API_RETRIES || 3),
  halfOpenAfterInMs: Number(process.env.BROULETTE_PHOTON_API_TIMEOUT || 5_000),
  closeAfterNumberOfFailures: Number(process.env.BROULETTE_PHOTON_API_CLOSE_AFTER || 5),
  timeoutInMs: Number(process.env.BROULETTE_PHOTON_API_TIMEOUT || 5000)
};

export const GOOGLE_PLACE_CONFIG: GooglePlaceConfiguration = {
  apiKey: process.env.BROULETTE_GOOGLE_PLACE_API_KEY ?? "",
  rateLimiting: {
    maxNumberOfAttemptsPerMonth: Number(process.env.BROULETTE_GOOGLE_PLACE_API_MAX_NUMBER_OF_ATTEMPTS_PER_MONTH || 200),
  },
  search: {
    radiusInMeters: Number(process.env.BROULETTE_GOOGLE_PLACE_API_SEARCH_RADIUS_IN_METERS || 50)
  },
  photo: {
    maxWidthInPx: Number(process.env.BROULETTE_GOOGLE_PLACE_API_PHOTO_MAX_WIDTH_IN_PX || 1024),
    maxHeightInPx: Number(process.env.BROULETTE_GOOGLE_PLACE_API_PHOTO_MAX_HEIGHT_IN_PX || 512)
  },
  similarity: {
    weight: {
      name: Number(process.env.BROULETTE_GOOGLE_PLACE_API_SIMILARITY_WEIGHT_NAME || 0.4),
      location: Number(process.env.BROULETTE_GOOGLE_PLACE_API_SIMILARITY_WEIGHT_LOCATION || 0.6),
    },
    maxDistanceInMeters: Number(process.env.BROULETTE_GOOGLE_PLACE_API_SEARCH_RADIUS_IN_METERS || 50)
  }
};

export const GOOGLE_PLACE_FAILOVER_CONFIG: FailoverConfiguration = {
  retry: Number(process.env.BROULETTE_GOOGLE_PLACE_API_RETRIES || 3),
  halfOpenAfterInMs: Number(process.env.BROULETTE_GOOGLE_PLACE_API_TIMEOUT || 5_000),
  closeAfterNumberOfFailures: Number(process.env.BROULETTE_GOOGLE_PLACE_API_CLOSE_AFTER || 5),
  timeoutInMs: Number(process.env.BROULETTE_GOOGLE_PLACE_API_TIMEOUT || 5000)
};

export const OVERPASS_FAILOVER_CONFIG: FailoverConfiguration = {
  retry: Number(process.env.BROULETTE_OVERPASS_API_RETRIES || 3),
  halfOpenAfterInMs: Number(process.env.BROULETTE_OVERPASS_API_TIMEOUT || 2_000),
  closeAfterNumberOfFailures: Number(process.env.BROULETTE_OVERPASS_API_CLOSE_AFTER || 5),
  timeoutInMs: Number(process.env.BROULETTE_OVERPASS_API_TIMEOUT || 10_000)
};

export const OVERPASS_CONFIG: OverpassConfiguration = {
  instanceUrls: [process.env.BROULETTE_OVERPASS_API_INSTANCE_URL || "https://overpass-api.de/api/interpreter"], // TODO parse env
  timeoutInMs: OVERPASS_FAILOVER_CONFIG.timeoutInMs
};


export const GEOCODING_CONFIGURATION: GeocodingProviderConfiguration = {
  nominatim: NOMINATIM_CONFIG,
  photon: PHOTON_CONFIG,
  providerSwitchDelay: 300
};

export const RESTAURANT_TYPES_TO_EXCLUDE: string[] = [
  "restaurant",
  "establishment",
  "point_of_interest",
  "food",
];

export const SEARCH_ENGINE_CONFIGURATION: SearchEngineConfiguration = {
  discovery: {
    overpass: OVERPASS_CONFIG,
    initialDiscoveryRangeMeters: Number(process.env.BROULETTE_SEARCH_ENGINE_INITIAL_DISCOVERY_RANGE_METERS ?? 5000),
    discoveryRangeIncreaseMeters: Number(process.env.BROULETTE_SEARCH_ENGINE_DISCOVERY_RANGE_INCREASE_METERS ?? 3000),
    maxDiscoveryIterations: Number(process.env.BROULETTE_SEARCH_ENGINE_MAX_DISCOVERY_ITERATIONS ?? 3)
  },
  matching: {
    tags: {
      hiddenTags: process.env.BROULETTE_TAGS_TO_EXCLUDE?.split(',')?.map(tag => tag.trim()) || RESTAURANT_TYPES_TO_EXCLUDE,
      priorityTags: process.env.BROULETTE_TAGS_TO_PRIORITIZE?.split(',')?.map(tag => tag.trim()) || [],
      maxTags: Number(process.env.BROULETTE_TAGS_MAXIMUM || 10)
    },
    google: GOOGLE_PLACE_CONFIG
  }
};

export const SERVER_CONFIG = {
  geocoding: GEOCODING_CONFIGURATION,
  search: SEARCH_ENGINE_CONFIGURATION
} as const;

function initialize() {
  initializeNominatim(NOMINATIM_FAILOVER_CONFIG);
  initializePhoton(PHOTON_FAILOVER_CONFIG);
  initializeOverpass(OVERPASS_FAILOVER_CONFIG);
  initializeGooglePlace(GOOGLE_PLACE_FAILOVER_CONFIG);
}

initialize();
