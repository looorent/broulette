import { registerNominatim, registerPhoton } from "@features/address.server";
import type { FailoverConfiguration } from "@features/circuit-breaker.server";
import { DEFAULT_FAILOVER } from "@features/circuit-breaker.server/types";
import { initializeGoogle, type GooglePlaceConfiguration } from "@features/google.server";
import { DEFAULT_NOMINATIM_CONFIGURATION, initializeNominatim, type GeocodingNominatimConfiguration } from "@features/nominatim.server";
import { DEFAULT_OVERPASS_CONFIGURATION, initializeOverpass, type OverpassConfiguration } from "@features/overpass.server";
import { initializePhoton, type GeocodingPhotonConfiguration } from "@features/photon.server";
import { DEFAULT_PHOTON_CONFIGURATION } from "@features/photon.server/types";
import type { SearchEngineConfiguration } from "@features/search-engine.server";

export const APP_CONFIG = {
  name: "BiteRoulette",
  version: "0.0.1",
  privacy: {
    updatedAt: "December 7, 2025",
    contactEmail: "hello@biteroulette.com"
  }
} as const;

function readArray(text: string | undefined): string[] | undefined {
  if (text && text?.length > 0) {
    return text.split(",");
  } else {
    return undefined;
  }
}

export type AppConfiguration = typeof APP_CONFIG;

export const NOMINATIM_CONFIG: GeocodingNominatimConfiguration = {
  instanceUrls: readArray(process.env.BROULETTE_NOMINATIM_INSTANCE_URLS) || DEFAULT_NOMINATIM_CONFIGURATION.instanceUrls,
  userAgent: process.env.BROULETTE_NOMINATIM_USER_AGENT ?? `${APP_CONFIG.name}/${APP_CONFIG.version}`,
  bottomNote: process.env.BROULETTE_NOMINATIM_BOTTOM_NOTE ?? DEFAULT_NOMINATIM_CONFIGURATION.bottomNote,
  maxNumberOfAddresses: Number(process.env.BROULETTE_NOMINATIM_NUMBER_0F_ADDRESSES || DEFAULT_NOMINATIM_CONFIGURATION.maxNumberOfAddresses)
};

export const NOMINATIM_FAILOVER_CONFIG: FailoverConfiguration = {
  retry: Number(process.env.BROULETTE_NOMINATIM_API_RETRIES || DEFAULT_FAILOVER.retry),
  halfOpenAfterInMs: Number(process.env.BROULETTE_NOMINATIM_API_TIMEOUT || DEFAULT_FAILOVER.halfOpenAfterInMs),
  closeAfterNumberOfFailures: Number(process.env.BROULETTE_NOMINATIM_API_CLOSE_AFTER || DEFAULT_FAILOVER.closeAfterNumberOfFailures),
  timeoutInMs: Number(process.env.BROULETTE_NOMINATIM_API_TIMEOUT || DEFAULT_FAILOVER.timeoutInMs)
};

export const PHOTON_CONFIG: GeocodingPhotonConfiguration = {
  instanceUrls: readArray(process.env.BROULETTE_PHOTON_INSTANCE_URLS) || DEFAULT_PHOTON_CONFIGURATION.instanceUrls,
  bottomNote: process.env.BROULETTE_PHOTON_BOTTOM_NOTE ?? DEFAULT_PHOTON_CONFIGURATION.bottomNote,
  maxNumberOfAddresses: Number(process.env.BROULETTE_PHOTON_NUMBER_0F_ADDRESSES || DEFAULT_PHOTON_CONFIGURATION.maxNumberOfAddresses),
};

export const PHOTON_FAILOVER_CONFIG: FailoverConfiguration = {
  retry: Number(process.env.BROULETTE_PHOTON_API_RETRIES || DEFAULT_FAILOVER.retry),
  halfOpenAfterInMs: Number(process.env.BROULETTE_PHOTON_API_TIMEOUT || DEFAULT_FAILOVER.halfOpenAfterInMs),
  closeAfterNumberOfFailures: Number(process.env.BROULETTE_PHOTON_API_CLOSE_AFTER || DEFAULT_FAILOVER.closeAfterNumberOfFailures),
  timeoutInMs: Number(process.env.BROULETTE_PHOTON_API_TIMEOUT || DEFAULT_FAILOVER.timeoutInMs)
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
  retry: Number(process.env.BROULETTE_GOOGLE_PLACE_API_RETRIES || DEFAULT_FAILOVER.retry),
  halfOpenAfterInMs: Number(process.env.BROULETTE_GOOGLE_PLACE_API_TIMEOUT || DEFAULT_FAILOVER.halfOpenAfterInMs),
  closeAfterNumberOfFailures: Number(process.env.BROULETTE_GOOGLE_PLACE_API_CLOSE_AFTER || DEFAULT_FAILOVER.closeAfterNumberOfFailures),
  timeoutInMs: Number(process.env.BROULETTE_GOOGLE_PLACE_API_TIMEOUT || DEFAULT_FAILOVER.timeoutInMs)
};

export const OVERPASS_FAILOVER_CONFIG: FailoverConfiguration = {
  retry: Number(process.env.BROULETTE_OVERPASS_API_RETRIES || DEFAULT_FAILOVER.retry),
  halfOpenAfterInMs: Number(process.env.BROULETTE_OVERPASS_API_TIMEOUT || DEFAULT_FAILOVER.halfOpenAfterInMs),
  closeAfterNumberOfFailures: Number(process.env.BROULETTE_OVERPASS_API_CLOSE_AFTER || DEFAULT_FAILOVER.closeAfterNumberOfFailures),
  timeoutInMs: Number(process.env.BROULETTE_OVERPASS_API_TIMEOUT || DEFAULT_FAILOVER.timeoutInMs)
};

export const OVERPASS_CONFIG: OverpassConfiguration = {
  instanceUrls: readArray(process.env.BROULETTE_OVERPASS_API_INSTANCE_URLS) || DEFAULT_OVERPASS_CONFIGURATION.instanceUrls
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
  // TODO add service provider
  search: SEARCH_ENGINE_CONFIGURATION
} as const;

function initialize() {
  // TODO we should initialize conditionnally
  initializeNominatim(NOMINATIM_FAILOVER_CONFIG);
  initializePhoton(PHOTON_FAILOVER_CONFIG);
  initializeOverpass(OVERPASS_FAILOVER_CONFIG);
  initializeGoogle(GOOGLE_PLACE_FAILOVER_CONFIG);

  // TODO we should registered conditionnally
  registerNominatim(NOMINATIM_CONFIG);
  registerPhoton(PHOTON_CONFIG);


  registerOverpass(OVERPASS_CONFIG);
}

initialize();
