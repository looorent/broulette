import { createContext } from "react-router";

import { DEFAULT_FAILOVER } from "@features/circuit-breaker.server";
import { DEFAULT_DISCOVERY_CONFIGURATION } from "@features/discovery.server";
import { DEFAULT_GOOGLE_PLACE_CONFIGURATION, type GooglePlaceConfiguration } from "@features/google.server";
import { DEFAULT_NOMINATIM_CONFIGURATION, type NominatimConfiguration } from "@features/nominatim.server";
import { DEFAULT_OVERPASS_CONFIGURATION, type OverpassConfiguration } from "@features/overpass.server";
import { DEFAULT_PHOTON_CONFIGURATION, type PhotonConfiguration } from "@features/photon.server";
import { DEFAULT_SEARCH_ENGINE_CONFIGURATION, type SearchEngineConfiguration } from "@features/search-engine.server";
import { DEFAULT_TAG_CONFIGURATION } from "@features/tag.server";
import { DEFAULT_TRIPADVISOR_CONFIGURATION, parseTripAdvisorPhotoSize, type TripAdvisorConfiguration } from "@features/tripadvisor.server";

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

let NOMINATIM_CONFIG: NominatimConfiguration;
export function nominatimConfig(env: any): NominatimConfiguration {
  if (!NOMINATIM_CONFIG) {
    NOMINATIM_CONFIG = {
      enabled: env.BROULETTE_NOMINATIM_ENABLED?.toLowerCase() === "true",
      instanceUrls: readArray(env.BROULETTE_NOMINATIM_INSTANCE_URLS) || DEFAULT_NOMINATIM_CONFIGURATION.instanceUrls,
      userAgent: env.BROULETTE_NOMINATIM_USER_AGENT ?? `${APP_CONFIG.name}/${APP_CONFIG.version}`,
      bottomNote: env.BROULETTE_NOMINATIM_BOTTOM_NOTE ?? DEFAULT_NOMINATIM_CONFIGURATION.bottomNote,
      maxNumberOfAddresses: Number(env.BROULETTE_NOMINATIM_NUMBER_0F_ADDRESSES || DEFAULT_NOMINATIM_CONFIGURATION.maxNumberOfAddresses),
      failover: {
        retry: Number(env.BROULETTE_NOMINATIM_API_RETRIES || DEFAULT_FAILOVER.retry),
        halfOpenAfterInMs: Number(env.BROULETTE_NOMINATIM_API_TIMEOUT || DEFAULT_FAILOVER.halfOpenAfterInMs),
        closeAfterNumberOfFailures: Number(env.BROULETTE_NOMINATIM_API_CLOSE_AFTER || DEFAULT_FAILOVER.closeAfterNumberOfFailures),
        timeoutInMs: Number(env.BROULETTE_NOMINATIM_API_TIMEOUT || DEFAULT_FAILOVER.timeoutInMs)
      }
    };
  }
  return NOMINATIM_CONFIG;
}

let PHOTON_CONFIG: PhotonConfiguration;
export function photonConfig(env: any): PhotonConfiguration {
  if (!PHOTON_CONFIG) {
    PHOTON_CONFIG = {
      enabled: env.BROULETTE_PHOTON_ENABLED?.toLowerCase() === "true",
      instanceUrls: readArray(env.BROULETTE_PHOTON_INSTANCE_URLS) || DEFAULT_PHOTON_CONFIGURATION.instanceUrls,
      bottomNote: env.BROULETTE_PHOTON_BOTTOM_NOTE ?? DEFAULT_PHOTON_CONFIGURATION.bottomNote,
      maxNumberOfAddresses: Number(env.BROULETTE_PHOTON_NUMBER_0F_ADDRESSES || DEFAULT_PHOTON_CONFIGURATION.maxNumberOfAddresses),
      failover: {
        retry: Number(env.BROULETTE_PHOTON_API_RETRIES || DEFAULT_FAILOVER.retry),
        halfOpenAfterInMs: Number(env.BROULETTE_PHOTON_API_TIMEOUT || DEFAULT_FAILOVER.halfOpenAfterInMs),
        closeAfterNumberOfFailures: Number(env.BROULETTE_PHOTON_API_CLOSE_AFTER || DEFAULT_FAILOVER.closeAfterNumberOfFailures),
        timeoutInMs: Number(env.BROULETTE_PHOTON_API_TIMEOUT || DEFAULT_FAILOVER.timeoutInMs)
      }
    };
  }
  return PHOTON_CONFIG;
}

let GOOGLE_PLACE_CONFIG: GooglePlaceConfiguration;
export function googleConfig(env: any): GooglePlaceConfiguration {
  if (!GOOGLE_PLACE_CONFIG) {
    GOOGLE_PLACE_CONFIG = {
      enabled: env.BROULETTE_GOOGLE_PLACE_ENABLED?.toLowerCase() === "true",
      baseUrl: env.BROULETTE_GOOGLE_PLACE_BASE_URL || DEFAULT_GOOGLE_PLACE_CONFIGURATION.baseUrl,
      apiKey: env.BROULETTE_GOOGLE_PLACE_API_KEY ?? "",
      rateLimiting: {
        maxNumberOfAttemptsPerMonth: Number(env.BROULETTE_GOOGLE_PLACE_API_MAX_NUMBER_OF_ATTEMPTS_PER_MONTH || DEFAULT_GOOGLE_PLACE_CONFIGURATION.rateLimiting.maxNumberOfAttemptsPerMonth),
      },
      search: {
        radiusInMeters: Number(env.BROULETTE_GOOGLE_PLACE_API_SEARCH_RADIUS_IN_METERS || DEFAULT_GOOGLE_PLACE_CONFIGURATION.search.radiusInMeters)
      },
      photo: {
        maxWidthInPx: Number(env.BROULETTE_GOOGLE_PLACE_API_PHOTO_MAX_WIDTH_IN_PX || DEFAULT_GOOGLE_PLACE_CONFIGURATION.photo.maxWidthInPx),
        maxHeightInPx: Number(env.BROULETTE_GOOGLE_PLACE_API_PHOTO_MAX_HEIGHT_IN_PX || DEFAULT_GOOGLE_PLACE_CONFIGURATION.photo.maxHeightInPx)
      },
      similarity: {
        weight: {
          name: Number(env.BROULETTE_GOOGLE_PLACE_API_SIMILARITY_WEIGHT_NAME || DEFAULT_GOOGLE_PLACE_CONFIGURATION.similarity.weight.name),
          location: Number(env.BROULETTE_GOOGLE_PLACE_API_SIMILARITY_WEIGHT_LOCATION || DEFAULT_GOOGLE_PLACE_CONFIGURATION.similarity.weight.location),
        },
        maxDistanceInMeters: Number(env.BROULETTE_GOOGLE_PLACE_API_SEARCH_RADIUS_IN_METERS || DEFAULT_GOOGLE_PLACE_CONFIGURATION.similarity.maxDistanceInMeters)
      },
      failover: {
        retry: Number(env.BROULETTE_GOOGLE_PLACE_API_RETRIES || DEFAULT_FAILOVER.retry),
        halfOpenAfterInMs: Number(env.BROULETTE_GOOGLE_PLACE_API_TIMEOUT || DEFAULT_FAILOVER.halfOpenAfterInMs),
        closeAfterNumberOfFailures: Number(env.BROULETTE_GOOGLE_PLACE_API_CLOSE_AFTER || DEFAULT_FAILOVER.closeAfterNumberOfFailures),
        timeoutInMs: Number(env.BROULETTE_GOOGLE_PLACE_API_TIMEOUT || DEFAULT_FAILOVER.timeoutInMs)
      }
    };
  }
  return GOOGLE_PLACE_CONFIG;
}

let TRIPADVISOR_CONFIG: TripAdvisorConfiguration;
export function tripAdvisorConfig(env: any): TripAdvisorConfiguration {
  if (!TRIPADVISOR_CONFIG) {
    TRIPADVISOR_CONFIG = {
      enabled: env.BROULETTE_TRIPADVISOR_ENABLED?.toLowerCase() === "true",
      instanceUrl: env.BROULETTE_TRIPADVISOR_INSTANCE_URL ?? DEFAULT_TRIPADVISOR_CONFIGURATION.instanceUrl,
      apiKey: env.BROULETTE_TRIPADVISOR_API_KEY ?? "",
      rateLimiting: {
        maxNumberOfAttemptsPerMonth: Number(env.BROULETTE_TRIPADVISOR_API_MAX_NUMBER_OF_ATTEMPTS_PER_MONTH || DEFAULT_TRIPADVISOR_CONFIGURATION.rateLimiting.maxNumberOfAttemptsPerMonth),
      },
      search: {
        radiusInMeters: Number(env.BROULETTE_TRIPADVISOR_API_SEARCH_RADIUS_IN_METERS || DEFAULT_TRIPADVISOR_CONFIGURATION.search.radiusInMeters)
      },
      similarity: {
        weight: {
          name: Number(env.BROULETTE_TRIPADVISOR_API_SIMILARITY_WEIGHT_NAME || DEFAULT_TRIPADVISOR_CONFIGURATION.similarity.weight.name),
          location: Number(env.BROULETTE_TRIPADVISOR_API_SIMILARITY_WEIGHT_LOCATION || DEFAULT_TRIPADVISOR_CONFIGURATION.similarity.weight.location),
        },
        maxDistanceInMeters: Number(env.BROULETTE_TRIPADVISOR_API_SEARCH_RADIUS_IN_METERS || DEFAULT_TRIPADVISOR_CONFIGURATION.similarity.maxDistanceInMeters),
        minScoreThreshold: Number(env.BROULETTE_TRIPADVISOR_API_SEARCH_MIN_SCORE_TRESHOLD || DEFAULT_TRIPADVISOR_CONFIGURATION.similarity.minScoreThreshold)
      },
      photo: parseTripAdvisorPhotoSize(env.BROULETTE_TRIPADVISOR_API_PHOTO_SIZE) || DEFAULT_TRIPADVISOR_CONFIGURATION.photo,
      failover: {
        retry: Number(env.BROULETTE_TRIPADVISOR_API_RETRIES || DEFAULT_FAILOVER.retry),
        halfOpenAfterInMs: Number(env.BROULETTE_TRIPADVISOR_API_TIMEOUT || DEFAULT_FAILOVER.halfOpenAfterInMs),
        closeAfterNumberOfFailures: Number(env.BROULETTE_TRIPADVISOR_API_CLOSE_AFTER || DEFAULT_FAILOVER.closeAfterNumberOfFailures),
        timeoutInMs: Number(env.BROULETTE_TRIPADVISOR_API_TIMEOUT || DEFAULT_FAILOVER.timeoutInMs)
      }
    };
  }
  return TRIPADVISOR_CONFIG;
}

let OVERPASS_CONFIG: OverpassConfiguration;
export function overpassConfig(env: any): OverpassConfiguration {
  if (!OVERPASS_CONFIG) {
    OVERPASS_CONFIG = {
      enabled: env.BROULETTE_OVERPASS_ENABLED?.toLowerCase() === "true",
      instanceUrls: readArray(env.BROULETTE_OVERPASS_API_INSTANCE_URLS) || DEFAULT_OVERPASS_CONFIGURATION.instanceUrls,
      failover: {
        retry: Number(env.BROULETTE_OVERPASS_API_RETRIES || DEFAULT_FAILOVER.retry),
        halfOpenAfterInMs: Number(env.BROULETTE_OVERPASS_API_TIMEOUT || DEFAULT_FAILOVER.halfOpenAfterInMs),
        closeAfterNumberOfFailures: Number(env.BROULETTE_OVERPASS_API_CLOSE_AFTER || DEFAULT_FAILOVER.closeAfterNumberOfFailures),
        timeoutInMs: Number(env.BROULETTE_OVERPASS_API_TIMEOUT || DEFAULT_FAILOVER.timeoutInMs)
      }
    };
  }
  return OVERPASS_CONFIG;
}

let SEARCH_ENGINE_CONFIGURATION: SearchEngineConfiguration;
export function searchEngineConfig(env: any): SearchEngineConfiguration {
  if (!SEARCH_ENGINE_CONFIGURATION) {
    SEARCH_ENGINE_CONFIGURATION = {
      discovery: {
        rangeIncreaseMeters: Number(env.BROULETTE_SEARCH_ENGINE_DISCOVERY_RANGE_INCREASE_METERS ?? DEFAULT_DISCOVERY_CONFIGURATION.rangeIncreaseMeters),
        maxDiscoveryIterations: Number(env.BROULETTE_SEARCH_ENGINE_MAX_DISCOVERY_ITERATIONS ?? DEFAULT_DISCOVERY_CONFIGURATION.maxDiscoveryIterations)
      },
      matching: {
        tags: {
          hiddenTags: readArray(env.BROULETTE_TAGS_TO_EXCLUDE) || DEFAULT_TAG_CONFIGURATION.hiddenTags,
          priorityTags: readArray(env.BROULETTE_TAGS_TO_PRIORITIZE) || DEFAULT_TAG_CONFIGURATION.priorityTags,
          maxTags: Number(env.BROULETTE_TAGS_MAXIMUM || readArray(env.BROULETTE_TAGS_TO_EXCLUDE) || DEFAULT_TAG_CONFIGURATION.maxTags)
        }
      },
      range: {
        close: {
          rangeInMeters: Number(env.BROULETTE_SEARCH_ENGINE_CLOSE_RANGE_IN_METERS || DEFAULT_SEARCH_ENGINE_CONFIGURATION.range.close.rangeInMeters),
          timeoutInMs: Number(env.BROULETTE_SEARCH_ENGINE_CLOSE_TIMEOUT_IN_MS || DEFAULT_SEARCH_ENGINE_CONFIGURATION.range.close.timeoutInMs)
        },
        midRange: {
          rangeInMeters: Number(env.BROULETTE_SEARCH_ENGINE_MID_RANGE_IN_METERS || DEFAULT_SEARCH_ENGINE_CONFIGURATION.range.midRange.rangeInMeters),
          timeoutInMs: Number(env.BROULETTE_SEARCH_ENGINE_MID_TIMEOUT_IN_MS || DEFAULT_SEARCH_ENGINE_CONFIGURATION.range.midRange.timeoutInMs)
        },
        far: {
          rangeInMeters: Number(env.BROULETTE_SEARCH_ENGINE_FAR_RANGE_IN_METERS || DEFAULT_SEARCH_ENGINE_CONFIGURATION.range.far.rangeInMeters),
          timeoutInMs: Number(env.BROULETTE_SEARCH_ENGINE_FAR_TIMEOUT_IN_MS || DEFAULT_SEARCH_ENGINE_CONFIGURATION.range.far.timeoutInMs)
        }
      }
    };
  }
  return SEARCH_ENGINE_CONFIGURATION;
}

export interface AppContext {
  nominatim: NominatimConfiguration | undefined;
  photon: PhotonConfiguration | undefined;
  overpass: OverpassConfiguration | undefined;
  google: GooglePlaceConfiguration | undefined;
  tripAdvisor: TripAdvisorConfiguration | undefined;
  search: SearchEngineConfiguration;
}

let APP_CONTEXT: AppContext | undefined;
export function createAppContext(env: any): AppContext {
  if (!APP_CONTEXT) {
    APP_CONTEXT = {
      nominatim: nominatimConfig(env).enabled ? nominatimConfig(env) : undefined,
      photon: photonConfig(env).enabled ? photonConfig(env) : undefined,
      overpass: overpassConfig(env).enabled ? overpassConfig(env) : undefined,
      google: googleConfig(env).enabled ? googleConfig(env) : undefined,
      tripAdvisor: tripAdvisorConfig(env).enabled ? tripAdvisorConfig(env) : undefined,
      search: searchEngineConfig(env)
    };
  }
  return APP_CONTEXT;
}

export const appContext = createContext<AppContext | null>(null);
