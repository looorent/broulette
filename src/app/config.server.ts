import { registerNominatim, registerPhoton } from "@features/address.server";
import type { FailoverConfiguration } from "@features/circuit-breaker.server";
import { DEFAULT_FAILOVER } from "@features/circuit-breaker.server";
import { DEFAULT_DISCOVERY_CONFIGURATION, registerOverpass } from "@features/discovery.server";
import { DEFAULT_GOOGLE_PLACE_CONFIGURATION, initializeGoogle, type GooglePlaceConfiguration } from "@features/google.server";
import { registerGooglePlace, registerTripAdvisor } from "@features/matching.server";
import { DEFAULT_NOMINATIM_CONFIGURATION, initializeNominatim, type NominatimConfiguration } from "@features/nominatim.server";
import { DEFAULT_OVERPASS_CONFIGURATION, initializeOverpass, type OverpassConfiguration } from "@features/overpass.server";
import { DEFAULT_PHOTON_CONFIGURATION, initializePhoton, type PhotonConfiguration } from "@features/photon.server";
import { DEFAULT_SEARCH_ENGINE_CONFIGURATION, type SearchEngineConfiguration } from "@features/search-engine.server";
import { DEFAULT_TAG_CONFIGURATION } from "@features/tag.server";
import { DEFAULT_TRIPADVISOR_CONFIGURATION, initializeTripAdvisor, type TripAdvisorConfiguration } from "@features/tripadvisor.server";

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

export const NOMINATIM_CONFIG: NominatimConfiguration = {
  enabled: process.env.BROULETTE_NOMINATIM_ENABLED?.toLowerCase() === "true",
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

export const PHOTON_CONFIG: PhotonConfiguration = {
  enabled: process.env.BROULETTE_PHOTON_ENABLED?.toLowerCase() === "true",
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
  enabled: process.env.BROULETTE_GOOGLE_PLACE_ENABLED?.toLowerCase() === "true",
  apiKey: process.env.BROULETTE_GOOGLE_PLACE_API_KEY ?? "",
  rateLimiting: {
    maxNumberOfAttemptsPerMonth: Number(process.env.BROULETTE_GOOGLE_PLACE_API_MAX_NUMBER_OF_ATTEMPTS_PER_MONTH || DEFAULT_GOOGLE_PLACE_CONFIGURATION.rateLimiting.maxNumberOfAttemptsPerMonth),
  },
  search: {
    radiusInMeters: Number(process.env.BROULETTE_GOOGLE_PLACE_API_SEARCH_RADIUS_IN_METERS || DEFAULT_GOOGLE_PLACE_CONFIGURATION.search.radiusInMeters)
  },
  photo: {
    maxWidthInPx: Number(process.env.BROULETTE_GOOGLE_PLACE_API_PHOTO_MAX_WIDTH_IN_PX || DEFAULT_GOOGLE_PLACE_CONFIGURATION.photo.maxWidthInPx),
    maxHeightInPx: Number(process.env.BROULETTE_GOOGLE_PLACE_API_PHOTO_MAX_HEIGHT_IN_PX || DEFAULT_GOOGLE_PLACE_CONFIGURATION.photo.maxHeightInPx)
  },
  similarity: {
    weight: {
      name: Number(process.env.BROULETTE_GOOGLE_PLACE_API_SIMILARITY_WEIGHT_NAME || DEFAULT_GOOGLE_PLACE_CONFIGURATION.similarity.weight.name),
      location: Number(process.env.BROULETTE_GOOGLE_PLACE_API_SIMILARITY_WEIGHT_LOCATION || DEFAULT_GOOGLE_PLACE_CONFIGURATION.similarity.weight.location),
    },
    maxDistanceInMeters: Number(process.env.BROULETTE_GOOGLE_PLACE_API_SEARCH_RADIUS_IN_METERS || DEFAULT_GOOGLE_PLACE_CONFIGURATION.similarity.maxDistanceInMeters)
  }
};

export const GOOGLE_PLACE_FAILOVER_CONFIG: FailoverConfiguration = {
  retry: Number(process.env.BROULETTE_GOOGLE_PLACE_API_RETRIES || DEFAULT_FAILOVER.retry),
  halfOpenAfterInMs: Number(process.env.BROULETTE_GOOGLE_PLACE_API_TIMEOUT || DEFAULT_FAILOVER.halfOpenAfterInMs),
  closeAfterNumberOfFailures: Number(process.env.BROULETTE_GOOGLE_PLACE_API_CLOSE_AFTER || DEFAULT_FAILOVER.closeAfterNumberOfFailures),
  timeoutInMs: Number(process.env.BROULETTE_GOOGLE_PLACE_API_TIMEOUT || DEFAULT_FAILOVER.timeoutInMs)
};

export const TRIPADVISOR_FAILOVER_CONFIG: FailoverConfiguration = {
  retry: Number(process.env.BROULETTE_TRIPADVISOR_API_RETRIES || DEFAULT_FAILOVER.retry),
  halfOpenAfterInMs: Number(process.env.BROULETTE_TRIPADVISOR_API_TIMEOUT || DEFAULT_FAILOVER.halfOpenAfterInMs),
  closeAfterNumberOfFailures: Number(process.env.BROULETTE_TRIPADVISOR_API_CLOSE_AFTER || DEFAULT_FAILOVER.closeAfterNumberOfFailures),
  timeoutInMs: Number(process.env.BROULETTE_TRIPADVISOR_API_TIMEOUT || DEFAULT_FAILOVER.timeoutInMs)
};

export const TRIPADVISOR_CONFIG: TripAdvisorConfiguration = {
  enabled: process.env.BROULETTE_TRIPADVISOR_ENABLED?.toLowerCase() === "true",
  instanceUrl: process.env.BROULETTE_TRIPADVISOR_INSTANCE_URL ?? DEFAULT_TRIPADVISOR_CONFIGURATION.instanceUrl,
  apiKey: process.env.BROULETTE_TRIPADVISOR_API_KEY ?? "",
  rateLimiting: {
    maxNumberOfAttemptsPerMonth: Number(process.env.BROULETTE_TRIPADVISOR_API_MAX_NUMBER_OF_ATTEMPTS_PER_MONTH || DEFAULT_TRIPADVISOR_CONFIGURATION.rateLimiting.maxNumberOfAttemptsPerMonth),
  },
  search: {
    radiusInMeters: Number(process.env.BROULETTE_TRIPADVISOR_API_SEARCH_RADIUS_IN_METERS || DEFAULT_TRIPADVISOR_CONFIGURATION.search.radiusInMeters)
  },
  similarity: {
    weight: {
      name: Number(process.env.BROULETTE_TRIPADVISOR_API_SIMILARITY_WEIGHT_NAME || DEFAULT_TRIPADVISOR_CONFIGURATION.similarity.weight.name),
      location: Number(process.env.BROULETTE_TRIPADVISOR_API_SIMILARITY_WEIGHT_LOCATION || DEFAULT_TRIPADVISOR_CONFIGURATION.similarity.weight.location),
    },
    maxDistanceInMeters: Number(process.env.BROULETTE_TRIPADVISOR_API_SEARCH_RADIUS_IN_METERS || DEFAULT_TRIPADVISOR_CONFIGURATION.similarity.maxDistanceInMeters),
    minScoreThreshold: Number(process.env.BROULETTE_TRIPADVISOR_API_SEARCH_MIN_SCORE_TRESHOLD || DEFAULT_TRIPADVISOR_CONFIGURATION.similarity.minScoreThreshold)
  }
};

export const OVERPASS_FAILOVER_CONFIG: FailoverConfiguration = {
  retry: Number(process.env.BROULETTE_OVERPASS_API_RETRIES || DEFAULT_FAILOVER.retry),
  halfOpenAfterInMs: Number(process.env.BROULETTE_OVERPASS_API_TIMEOUT || DEFAULT_FAILOVER.halfOpenAfterInMs),
  closeAfterNumberOfFailures: Number(process.env.BROULETTE_OVERPASS_API_CLOSE_AFTER || DEFAULT_FAILOVER.closeAfterNumberOfFailures),
  timeoutInMs: Number(process.env.BROULETTE_OVERPASS_API_TIMEOUT || DEFAULT_FAILOVER.timeoutInMs)
};

export const OVERPASS_CONFIG: OverpassConfiguration = {
  enabled: process.env.BROULETTE_OVERPASS_ENABLED?.toLowerCase() === "true",
  instanceUrls: readArray(process.env.BROULETTE_OVERPASS_API_INSTANCE_URLS) || DEFAULT_OVERPASS_CONFIGURATION.instanceUrls
};

export const SEARCH_ENGINE_CONFIGURATION: SearchEngineConfiguration = {
  discovery: {
    rangeIncreaseMeters: Number(process.env.BROULETTE_SEARCH_ENGINE_DISCOVERY_RANGE_INCREASE_METERS ?? DEFAULT_DISCOVERY_CONFIGURATION.rangeIncreaseMeters),
    maxDiscoveryIterations: Number(process.env.BROULETTE_SEARCH_ENGINE_MAX_DISCOVERY_ITERATIONS ?? DEFAULT_DISCOVERY_CONFIGURATION.maxDiscoveryIterations)
  },
  matching: {
    tags: {
      hiddenTags: readArray(process.env.BROULETTE_TAGS_TO_EXCLUDE) || DEFAULT_TAG_CONFIGURATION.hiddenTags,
      priorityTags: readArray(process.env.BROULETTE_TAGS_TO_PRIORITIZE) || DEFAULT_TAG_CONFIGURATION.priorityTags,
      maxTags: Number(process.env.BROULETTE_TAGS_MAXIMUM || readArray(process.env.BROULETTE_TAGS_TO_EXCLUDE) || DEFAULT_TAG_CONFIGURATION.maxTags)
    }
  },
  range: {
    close: {
      rangeInMeters: Number(process.env.BROULETTE_SEARCH_ENGINE_CLOSE_RANGE_IN_METERS || DEFAULT_SEARCH_ENGINE_CONFIGURATION.range.close.rangeInMeters),
      timeoutInMs: Number(process.env.BROULETTE_SEARCH_ENGINE_CLOSE_TIMEOUT_IN_MS || DEFAULT_SEARCH_ENGINE_CONFIGURATION.range.close.timeoutInMs)
    },
    midRange: {
      rangeInMeters: Number(process.env.BROULETTE_SEARCH_ENGINE_MID_RANGE_IN_METERS || DEFAULT_SEARCH_ENGINE_CONFIGURATION.range.midRange.rangeInMeters),
      timeoutInMs: Number(process.env.BROULETTE_SEARCH_ENGINE_MID_TIMEOUT_IN_MS || DEFAULT_SEARCH_ENGINE_CONFIGURATION.range.midRange.timeoutInMs)
    },
    far: {
      rangeInMeters: Number(process.env.BROULETTE_SEARCH_ENGINE_FAR_RANGE_IN_METERS || DEFAULT_SEARCH_ENGINE_CONFIGURATION.range.far.rangeInMeters),
      timeoutInMs: Number(process.env.BROULETTE_SEARCH_ENGINE_FAR_TIMEOUT_IN_MS || DEFAULT_SEARCH_ENGINE_CONFIGURATION.range.far.timeoutInMs)
    }
  }
};

interface Context {
  nominatim: NominatimConfiguration | undefined;
  photon: PhotonConfiguration | undefined;
  overpass: OverpassConfiguration | undefined;
  google: GooglePlaceConfiguration | undefined;
  tripAdvisor: TripAdvisorConfiguration | undefined;
  search: SearchEngineConfiguration;
}

function initializeContext(): Context {
  return {
    nominatim: NOMINATIM_CONFIG.enabled ? NOMINATIM_CONFIG : undefined,
    photon: PHOTON_CONFIG.enabled ? PHOTON_CONFIG : undefined,
    overpass: OVERPASS_CONFIG.enabled ? OVERPASS_CONFIG : undefined,
    google: GOOGLE_PLACE_CONFIG.enabled ? GOOGLE_PLACE_CONFIG : undefined,
    tripAdvisor: TRIPADVISOR_CONFIG.enabled ? TRIPADVISOR_CONFIG : undefined,
    search: SEARCH_ENGINE_CONFIGURATION
  };
}

function initializeApp(): Context {
  const context = initializeContext();

  initializeNominatim(NOMINATIM_FAILOVER_CONFIG);
  registerNominatim(context?.nominatim);

  initializePhoton(PHOTON_FAILOVER_CONFIG);
  registerPhoton(context?.photon);

  initializeOverpass(OVERPASS_FAILOVER_CONFIG);
  registerOverpass(context.overpass);

  initializeGoogle(GOOGLE_PLACE_FAILOVER_CONFIG);
  registerGooglePlace(context?.google);

  initializeTripAdvisor(TRIPADVISOR_FAILOVER_CONFIG);
  registerTripAdvisor(context?.tripAdvisor);

  return context;
}

export const CONTEXT = initializeApp();
