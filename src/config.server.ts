import { DEFAULT_FAILOVER, type FailoverConfiguration } from "@features/circuit-breaker.server";
import { DEFAULT_DISCOVERY_CONFIGURATION } from "@features/discovery.server";
import { DEFAULT_GOOGLE_PLACE_CONFIGURATION, type GooglePlaceConfiguration } from "@features/google.server";
import { DEFAULT_NOMINATIM_CONFIGURATION, type NominatimConfiguration } from "@features/nominatim.server";
import { DEFAULT_OVERPASS_CONFIGURATION, type OverpassConfiguration } from "@features/overpass.server";
import { DEFAULT_PHOTON_CONFIGURATION, type PhotonConfiguration } from "@features/photon.server";
import { DEFAULT_RATE_LIMIT_CONFIGURATION, type RateLimitConfiguration } from "@features/rate-limit.server";
import { DEFAULT_SEARCH_ENGINE_CONFIGURATION, type SearchEngineConfiguration } from "@features/search-engine.server";
import { DEFAULT_TAG_CONFIGURATION } from "@features/tag.server";
import { DEFAULT_TRIPADVISOR_CONFIGURATION, parseTripAdvisorPhotoSize, type TripAdvisorConfiguration } from "@features/tripadvisor.server";

export const APP_CONFIG = {
  name: "BiteRoulette",
  version: "0.0.4",
  privacy: {
    updatedAt: "January 8th, 2026",
    contactEmail: "hello@biteroulette.com"
  }
} as const;

export type AppConfiguration = typeof APP_CONFIG;

interface Env {
  // Nominatim
  BROULETTE_NOMINATIM_ENABLED?: string;
  BROULETTE_NOMINATIM_INSTANCE_URLS?: string;
  BROULETTE_NOMINATIM_USER_AGENT?: string;
  BROULETTE_NOMINATIM_BOTTOM_NOTE?: string;
  BROULETTE_NOMINATIM_NUMBER_OF_ADDRESSES?: string;
  BROULETTE_NOMINATIM_API_RETRIES?: string;
  BROULETTE_NOMINATIM_API_TIMEOUT?: string;
  BROULETTE_NOMINATIM_API_HALF_OPEN_AFTER_MS?: string;
  BROULETTE_NOMINATIM_CONSECUTIVE_FAILURES?: string;

  // Photon
  BROULETTE_PHOTON_ENABLED?: string;
  BROULETTE_PHOTON_INSTANCE_URLS?: string;
  BROULETTE_PHOTON_BOTTOM_NOTE?: string;
  BROULETTE_PHOTON_NUMBER_OF_ADDRESSES?: string;
  BROULETTE_PHOTON_API_RETRIES?: string;
  BROULETTE_PHOTON_API_TIMEOUT?: string;
  BROULETTE_PHOTON_API_HALF_OPEN_AFTER_MS?: string;
  BROULETTE_PHOTON_CONSECUTIVE_FAILURES?: string;

  // Google
  BROULETTE_GOOGLE_PLACE_ENABLED?: string;
  BROULETTE_GOOGLE_PLACE_BASE_URL?: string;
  BROULETTE_GOOGLE_PLACE_API_KEY?: string;
  BROULETTE_GOOGLE_PLACE_API_MAX_NUMBER_OF_ATTEMPTS_PER_MONTH?: string;
  BROULETTE_GOOGLE_PLACE_API_SEARCH_RADIUS_IN_METERS?: string;
  BROULETTE_GOOGLE_PLACE_API_PHOTO_MAX_WIDTH_IN_PX?: string;
  BROULETTE_GOOGLE_PLACE_API_PHOTO_MAX_HEIGHT_IN_PX?: string;
  BROULETTE_GOOGLE_PLACE_API_SIMILARITY_WEIGHT_NAME?: string;
  BROULETTE_GOOGLE_PLACE_API_SIMILARITY_WEIGHT_LOCATION?: string;
  BROULETTE_GOOGLE_PLACE_API_RETRIES?: string;
  BROULETTE_GOOGLE_PLACE_API_TIMEOUT?: string;
  BROULETTE_GOOGLE_PLACE_API_HALF_OPEN_AFTER_MS?: string;
  BROULETTE_GOOGLE_PLACE_API_CONSECUTIVE_FAILURES?: string;

  // TripAdvisor
  BROULETTE_TRIPADVISOR_ENABLED?: string;
  BROULETTE_TRIPADVISOR_INSTANCE_URL?: string;
  BROULETTE_TRIPADVISOR_API_KEY?: string;
  BROULETTE_TRIPADVISOR_API_MAX_NUMBER_OF_ATTEMPTS_PER_MONTH?: string;
  BROULETTE_TRIPADVISOR_API_SEARCH_RADIUS_IN_METERS?: string;
  BROULETTE_TRIPADVISOR_API_SIMILARITY_WEIGHT_NAME?: string;
  BROULETTE_TRIPADVISOR_API_SIMILARITY_WEIGHT_LOCATION?: string;
  BROULETTE_TRIPADVISOR_API_SEARCH_MIN_SCORE_THRESHOLD?: string;
  BROULETTE_TRIPADVISOR_API_PHOTO_SIZE?: string;
  BROULETTE_TRIPADVISOR_API_RETRIES?: string;
  BROULETTE_TRIPADVISOR_API_TIMEOUT?: string;
  BROULETTE_TRIPADVISOR_API_HALF_OPEN_AFTER_MS?: string;
  BROULETTE_TRIPADVISOR_CONSECUTIVE_FAILURES?: string;

  // Overpass
  BROULETTE_OVERPASS_ENABLED?: string;
  BROULETTE_OVERPASS_API_INSTANCE_URLS?: string;
  BROULETTE_OVERPASS_API_RETRIES?: string;
  BROULETTE_OVERPASS_API_TIMEOUT?: string;
  BROULETTE_OVERPASS_API_HALF_OPEN_AFTER_MS?: string;
  BROULETTE_OVERPASS_API_CONSECUTIVE_FAILURES?: string;

  // Rate Limiting
  BROULETTE_ADDRESS_SEARCH_RATE_LIMIT?: string;
  BROULETTE_ADDRESS_SEARCH_RATE_WINDOW_SECONDS?: string;

  // Search Engine
  BROULETTE_SEARCH_ENGINE_DISCOVERY_RANGE_INCREASE_METERS?: string;
  BROULETTE_SEARCH_ENGINE_MAX_DISCOVERY_ITERATIONS?: string;
  BROULETTE_TAGS_TO_EXCLUDE?: string;
  BROULETTE_TAGS_TO_PRIORITIZE?: string;
  BROULETTE_TAGS_MAXIMUM?: string;
  BROULETTE_SEARCH_ENGINE_CLOSE_RANGE_IN_METERS?: string;
  BROULETTE_SEARCH_ENGINE_CLOSE_TIMEOUT_IN_MS?: string;
  BROULETTE_SEARCH_ENGINE_MID_RANGE_IN_METERS?: string;
  BROULETTE_SEARCH_ENGINE_MID_TIMEOUT_IN_MS?: string;
  BROULETTE_SEARCH_ENGINE_FAR_RANGE_IN_METERS?: string;
  BROULETTE_SEARCH_ENGINE_FAR_TIMEOUT_IN_MS?: string;
}

function parseNumber(value: string | undefined, fallback: number): number {
  if (value === undefined || value === null || value.trim() === "") {
    return fallback;
  } else {
    const parsed = Number(value);
    return isNaN(parsed) ? fallback : parsed;
  }
}

function parseBoolean(value: string | undefined, fallback: boolean = false): boolean {
  if (value === undefined || value === null) {
    return fallback;
  } else {
    const normalized = value.toLowerCase().trim();
    return normalized === "true";
  }
}

function parseArray(value: string | undefined, fallback: string[] = []): string[] {
  if (value && value.length > 0) {
    return value.split(",").map(s => s.trim()).filter(s => s.length > 0);
  } else {
    return fallback;
  }
}

function parseFailover(
  retries: string | undefined,
  timeout: string | undefined,
  halfOpenAfter: string | undefined,
  consecutiveFailures: string | undefined,
  defaults: typeof DEFAULT_FAILOVER
): FailoverConfiguration {
  return {
    retry: parseNumber(retries, defaults.retry),
    halfOpenAfterInMs: parseNumber(halfOpenAfter, defaults.halfOpenAfterInMs),
    timeoutInMs: parseNumber(timeout, defaults.timeoutInMs),
    consecutiveFailures: parseNumber(consecutiveFailures, defaults.consecutiveFailures),
  };
}

// Configurations are cached at module scope so they are parsed only once per
// Cloudflare Worker isolate. The env object is read on the first call and the
// result is reused for all subsequent requests handled by the same isolate.
// Changing an environment variable therefore requires a new deployment to take effect.
let NOMINATIM_CONFIG: NominatimConfiguration;
function nominatimConfig(env: Env): NominatimConfiguration {
  if (!NOMINATIM_CONFIG) {
    NOMINATIM_CONFIG = {
      enabled: parseBoolean(env.BROULETTE_NOMINATIM_ENABLED),
      instanceUrls: parseArray(env.BROULETTE_NOMINATIM_INSTANCE_URLS, DEFAULT_NOMINATIM_CONFIGURATION.instanceUrls),
      userAgent: env.BROULETTE_NOMINATIM_USER_AGENT ?? `${APP_CONFIG.name}/${APP_CONFIG.version}`,
      bottomNote: env.BROULETTE_NOMINATIM_BOTTOM_NOTE ?? DEFAULT_NOMINATIM_CONFIGURATION.bottomNote,
      maxNumberOfAddresses: parseNumber(env.BROULETTE_NOMINATIM_NUMBER_OF_ADDRESSES, DEFAULT_NOMINATIM_CONFIGURATION.maxNumberOfAddresses),
      failover: parseFailover(
        env.BROULETTE_NOMINATIM_API_RETRIES,
        env.BROULETTE_NOMINATIM_API_TIMEOUT,
        env.BROULETTE_NOMINATIM_API_HALF_OPEN_AFTER_MS,
        env.BROULETTE_NOMINATIM_CONSECUTIVE_FAILURES,
        DEFAULT_FAILOVER
      )
    };
  }
  return NOMINATIM_CONFIG;
}

let PHOTON_CONFIG: PhotonConfiguration;
function photonConfig(env: Env): PhotonConfiguration {
  if (!PHOTON_CONFIG) {
    PHOTON_CONFIG = {
      enabled: parseBoolean(env.BROULETTE_PHOTON_ENABLED),
      instanceUrls: parseArray(env.BROULETTE_PHOTON_INSTANCE_URLS, DEFAULT_PHOTON_CONFIGURATION.instanceUrls),
      bottomNote: env.BROULETTE_PHOTON_BOTTOM_NOTE ?? DEFAULT_PHOTON_CONFIGURATION.bottomNote,
      // Note: BROULETTE_PHOTON_NUMBER_OF_ADDRESSES contains a typo '0' (zero) instead of 'O' in the environment variable name.
      maxNumberOfAddresses: parseNumber(env.BROULETTE_PHOTON_NUMBER_OF_ADDRESSES, DEFAULT_PHOTON_CONFIGURATION.maxNumberOfAddresses),
      failover: parseFailover(
        env.BROULETTE_PHOTON_API_RETRIES,
        env.BROULETTE_PHOTON_API_TIMEOUT,
        env.BROULETTE_PHOTON_API_HALF_OPEN_AFTER_MS,
        env.BROULETTE_PHOTON_CONSECUTIVE_FAILURES,
        DEFAULT_FAILOVER
      )
    };
  }
  return PHOTON_CONFIG;
}

let GOOGLE_PLACE_CONFIG: GooglePlaceConfiguration;
function googleConfig(env: Env): GooglePlaceConfiguration {
  if (!GOOGLE_PLACE_CONFIG) {
    GOOGLE_PLACE_CONFIG = {
      enabled: parseBoolean(env.BROULETTE_GOOGLE_PLACE_ENABLED),
      baseUrl: env.BROULETTE_GOOGLE_PLACE_BASE_URL || DEFAULT_GOOGLE_PLACE_CONFIGURATION.baseUrl,
      apiKey: env.BROULETTE_GOOGLE_PLACE_API_KEY ?? "",
      rateLimiting: {
        maxNumberOfAttemptsPerMonth: parseNumber(env.BROULETTE_GOOGLE_PLACE_API_MAX_NUMBER_OF_ATTEMPTS_PER_MONTH, DEFAULT_GOOGLE_PLACE_CONFIGURATION.rateLimiting.maxNumberOfAttemptsPerMonth),
      },
      search: {
        radiusInMeters: parseNumber(env.BROULETTE_GOOGLE_PLACE_API_SEARCH_RADIUS_IN_METERS, DEFAULT_GOOGLE_PLACE_CONFIGURATION.search.radiusInMeters)
      },
      photo: {
        maxWidthInPx: parseNumber(env.BROULETTE_GOOGLE_PLACE_API_PHOTO_MAX_WIDTH_IN_PX, DEFAULT_GOOGLE_PLACE_CONFIGURATION.photo.maxWidthInPx),
        maxHeightInPx: parseNumber(env.BROULETTE_GOOGLE_PLACE_API_PHOTO_MAX_HEIGHT_IN_PX, DEFAULT_GOOGLE_PLACE_CONFIGURATION.photo.maxHeightInPx)
      },
      similarity: {
        weight: {
          name: parseNumber(env.BROULETTE_GOOGLE_PLACE_API_SIMILARITY_WEIGHT_NAME, DEFAULT_GOOGLE_PLACE_CONFIGURATION.similarity.weight.name),
          location: parseNumber(env.BROULETTE_GOOGLE_PLACE_API_SIMILARITY_WEIGHT_LOCATION, DEFAULT_GOOGLE_PLACE_CONFIGURATION.similarity.weight.location),
        },
        maxDistanceInMeters: parseNumber(env.BROULETTE_GOOGLE_PLACE_API_SEARCH_RADIUS_IN_METERS, DEFAULT_GOOGLE_PLACE_CONFIGURATION.similarity.maxDistanceInMeters)
      },
      failover: parseFailover(
        env.BROULETTE_GOOGLE_PLACE_API_RETRIES,
        env.BROULETTE_GOOGLE_PLACE_API_TIMEOUT,
        env.BROULETTE_GOOGLE_PLACE_API_HALF_OPEN_AFTER_MS,
        env.BROULETTE_GOOGLE_PLACE_API_CONSECUTIVE_FAILURES,
        DEFAULT_FAILOVER
      )
    };
  }
  return GOOGLE_PLACE_CONFIG;
}

let TRIPADVISOR_CONFIG: TripAdvisorConfiguration;
function tripAdvisorConfig(env: Env): TripAdvisorConfiguration {
  if (!TRIPADVISOR_CONFIG) {
    TRIPADVISOR_CONFIG = {
      enabled: parseBoolean(env.BROULETTE_TRIPADVISOR_ENABLED),
      instanceUrl: env.BROULETTE_TRIPADVISOR_INSTANCE_URL ?? DEFAULT_TRIPADVISOR_CONFIGURATION.instanceUrl,
      apiKey: env.BROULETTE_TRIPADVISOR_API_KEY ?? "",
      rateLimiting: {
        maxNumberOfAttemptsPerMonth: parseNumber(env.BROULETTE_TRIPADVISOR_API_MAX_NUMBER_OF_ATTEMPTS_PER_MONTH, DEFAULT_TRIPADVISOR_CONFIGURATION.rateLimiting.maxNumberOfAttemptsPerMonth),
      },
      search: {
        radiusInMeters: parseNumber(env.BROULETTE_TRIPADVISOR_API_SEARCH_RADIUS_IN_METERS, DEFAULT_TRIPADVISOR_CONFIGURATION.search.radiusInMeters)
      },
      similarity: {
        weight: {
          name: parseNumber(env.BROULETTE_TRIPADVISOR_API_SIMILARITY_WEIGHT_NAME, DEFAULT_TRIPADVISOR_CONFIGURATION.similarity.weight.name),
          location: parseNumber(env.BROULETTE_TRIPADVISOR_API_SIMILARITY_WEIGHT_LOCATION, DEFAULT_TRIPADVISOR_CONFIGURATION.similarity.weight.location),
        },
        maxDistanceInMeters: parseNumber(env.BROULETTE_TRIPADVISOR_API_SEARCH_RADIUS_IN_METERS, DEFAULT_TRIPADVISOR_CONFIGURATION.similarity.maxDistanceInMeters),
        minScoreThreshold: parseNumber(env.BROULETTE_TRIPADVISOR_API_SEARCH_MIN_SCORE_THRESHOLD, DEFAULT_TRIPADVISOR_CONFIGURATION.similarity.minScoreThreshold)
      },
      photo: parseTripAdvisorPhotoSize(env.BROULETTE_TRIPADVISOR_API_PHOTO_SIZE) || DEFAULT_TRIPADVISOR_CONFIGURATION.photo,
      failover: parseFailover(
        env.BROULETTE_TRIPADVISOR_API_RETRIES,
        env.BROULETTE_TRIPADVISOR_API_TIMEOUT,
        env.BROULETTE_TRIPADVISOR_API_HALF_OPEN_AFTER_MS,
        env.BROULETTE_TRIPADVISOR_CONSECUTIVE_FAILURES,
        DEFAULT_FAILOVER
      )
    };
  }
  return TRIPADVISOR_CONFIG;
}

let OVERPASS_CONFIG: OverpassConfiguration;
function overpassConfig(env: Env): OverpassConfiguration {
  if (!OVERPASS_CONFIG) {
    OVERPASS_CONFIG = {
      enabled: parseBoolean(env.BROULETTE_OVERPASS_ENABLED),
      instanceUrls: parseArray(env.BROULETTE_OVERPASS_API_INSTANCE_URLS, DEFAULT_OVERPASS_CONFIGURATION.instanceUrls),
      failover: parseFailover(
        env.BROULETTE_OVERPASS_API_RETRIES,
        env.BROULETTE_OVERPASS_API_TIMEOUT,
        env.BROULETTE_OVERPASS_API_HALF_OPEN_AFTER_MS,
        env.BROULETTE_OVERPASS_API_CONSECUTIVE_FAILURES,
        DEFAULT_FAILOVER
      )
    };
  }
  return OVERPASS_CONFIG;
}

let SEARCH_ENGINE_CONFIGURATION: SearchEngineConfiguration;
function searchEngineConfig(env: Env): SearchEngineConfiguration {
  if (!SEARCH_ENGINE_CONFIGURATION) {
    SEARCH_ENGINE_CONFIGURATION = {
      discovery: {
        rangeIncreaseMeters: parseNumber(env.BROULETTE_SEARCH_ENGINE_DISCOVERY_RANGE_INCREASE_METERS, DEFAULT_DISCOVERY_CONFIGURATION.rangeIncreaseMeters),
        maxDiscoveryIterations: parseNumber(env.BROULETTE_SEARCH_ENGINE_MAX_DISCOVERY_ITERATIONS, DEFAULT_DISCOVERY_CONFIGURATION.maxDiscoveryIterations)
      },
      matching: {
        tags: {
          hiddenTags: parseArray(env.BROULETTE_TAGS_TO_EXCLUDE, DEFAULT_TAG_CONFIGURATION.hiddenTags),
          priorityTags: parseArray(env.BROULETTE_TAGS_TO_PRIORITIZE, DEFAULT_TAG_CONFIGURATION.priorityTags),
          maxTags: parseNumber(env.BROULETTE_TAGS_MAXIMUM, DEFAULT_TAG_CONFIGURATION.maxTags)
        }
      },
      range: {
        close: {
          rangeInMeters: parseNumber(env.BROULETTE_SEARCH_ENGINE_CLOSE_RANGE_IN_METERS, DEFAULT_SEARCH_ENGINE_CONFIGURATION.range.close.rangeInMeters),
          timeoutInMs: parseNumber(env.BROULETTE_SEARCH_ENGINE_CLOSE_TIMEOUT_IN_MS, DEFAULT_SEARCH_ENGINE_CONFIGURATION.range.close.timeoutInMs)
        },
        midRange: {
          rangeInMeters: parseNumber(env.BROULETTE_SEARCH_ENGINE_MID_RANGE_IN_METERS, DEFAULT_SEARCH_ENGINE_CONFIGURATION.range.midRange.rangeInMeters),
          timeoutInMs: parseNumber(env.BROULETTE_SEARCH_ENGINE_MID_TIMEOUT_IN_MS, DEFAULT_SEARCH_ENGINE_CONFIGURATION.range.midRange.timeoutInMs)
        },
        far: {
          rangeInMeters: parseNumber(env.BROULETTE_SEARCH_ENGINE_FAR_RANGE_IN_METERS, DEFAULT_SEARCH_ENGINE_CONFIGURATION.range.far.rangeInMeters),
          timeoutInMs: parseNumber(env.BROULETTE_SEARCH_ENGINE_FAR_TIMEOUT_IN_MS, DEFAULT_SEARCH_ENGINE_CONFIGURATION.range.far.timeoutInMs)
        }
      }
    };
  }
  return SEARCH_ENGINE_CONFIGURATION;
}

let RATE_LIMIT_CONFIG: RateLimitConfiguration;
function rateLimitConfig(env: Env): RateLimitConfiguration {
  if (!RATE_LIMIT_CONFIG) {
    RATE_LIMIT_CONFIG = {
      limit: parseNumber(env.BROULETTE_ADDRESS_SEARCH_RATE_LIMIT, DEFAULT_RATE_LIMIT_CONFIGURATION.limit),
      windowSeconds: parseNumber(env.BROULETTE_ADDRESS_SEARCH_RATE_WINDOW_SECONDS, DEFAULT_RATE_LIMIT_CONFIGURATION.windowSeconds)
    };
  }
  return RATE_LIMIT_CONFIG;
}

export interface AppContext {
  nominatim: NominatimConfiguration | undefined;
  photon: PhotonConfiguration | undefined;
  overpass: OverpassConfiguration | undefined;
  google: GooglePlaceConfiguration | undefined;
  tripAdvisor: TripAdvisorConfiguration | undefined;
  search: SearchEngineConfiguration;
  addressSearchRateLimit: RateLimitConfiguration;
}

let APP_CONTEXT: AppContext | undefined;
export function createAppContext(env: Env): AppContext {
  if (!APP_CONTEXT) {
    APP_CONTEXT = {
      nominatim: nominatimConfig(env).enabled ? nominatimConfig(env) : undefined,
      photon: photonConfig(env).enabled ? photonConfig(env) : undefined,
      overpass: overpassConfig(env).enabled ? overpassConfig(env) : undefined,
      google: googleConfig(env).enabled ? googleConfig(env) : undefined,
      tripAdvisor: tripAdvisorConfig(env).enabled ? tripAdvisorConfig(env) : undefined,
      search: searchEngineConfig(env),
      addressSearchRateLimit: rateLimitConfig(env)
    };
  }
  return APP_CONTEXT;
}
