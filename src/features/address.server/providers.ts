import { LoadBalancer, type ServiceStrategy } from "@features/balancer.server";
import { roundCoordinates, type Coordinates } from "@features/coordinate";
import { fetchLocationFromNominatim, type NominatimConfiguration } from "@features/nominatim.server";
import { fetchLocationFromPhoton, type PhotonConfiguration } from "@features/photon.server";
import type { LocationSuggestions } from "@features/search";
import { logger } from "@features/utils/logger";

interface AddressSearchCacheOptions {
  keyStore: KVNamespace;
  ttlSeconds: number;
}

type SearchArgs = [string, Coordinates | undefined, AbortSignal?];
let LOAD_BALANCER: LoadBalancer<SearchArgs, LocationSuggestions>;

function loadBalancer(
  nominatim: NominatimConfiguration | undefined,
  photon: PhotonConfiguration | undefined
) {
  if (!LOAD_BALANCER) {
    LOAD_BALANCER = new LoadBalancer<SearchArgs, LocationSuggestions>([
      ...registerNominatim(nominatim),
      ...registerPhoton(photon)
    ]);
    logger.info("[Address Search] Load Balancer initialized with %d active strategies.", LOAD_BALANCER.numberOfProviders);
  }
  return LOAD_BALANCER;
}

export async function searchLocations(
  query: string,
  nominatim: NominatimConfiguration | undefined,
  photon: PhotonConfiguration | undefined,
  deviceLocation?: Coordinates | undefined,
  signal?: AbortSignal | undefined,
  cache?: AddressSearchCacheOptions | undefined
): Promise<LocationSuggestions> {
  logger.log("[Address Search] Executing search for query: '%s'%s", query, deviceLocation ? ` with location bias (${deviceLocation.latitude}, ${deviceLocation.longitude})` : "");

  const cacheKey = cache ? buildCacheKey(query, deviceLocation) : undefined;
  const cachedResults = await readCache(cache?.keyStore, cacheKey);
  if (cachedResults) {
    return cachedResults;
  } else {
    try {
      const results = await loadBalancer(nominatim, photon).execute(query, deviceLocation, signal);
      logger.log("[Address Search] Found %d results for '%s'", results?.locations?.length, query);
      writeCache(cache?.keyStore, cacheKey, cache?.ttlSeconds, results);
      return results;
    } catch (error) {
      logger.error("[Address Search] Error searching for '%s': %s", query, error);
      throw error;
    }
  }
}

function registerNominatim(configuration: NominatimConfiguration | undefined): ServiceStrategy<SearchArgs, LocationSuggestions>[] {
  if (configuration?.enabled) {
    logger.info("[Address Search] Registering Nominatim with %d instances.", configuration.instanceUrls.length);
    return configuration.instanceUrls.map(instanceUrl => ({
      name: `nominatim:${instanceUrl}`,
      execute: (query: string, deviceLocation?: Coordinates | undefined, signal?: AbortSignal | undefined): Promise<LocationSuggestions> =>
        fetchLocationFromNominatim(query, instanceUrl, configuration, deviceLocation, signal)
    }));
  } else {
    logger.info("[Address Search] Nominatim is disabled or unconfigured.");
    return [];
  }
}

function registerPhoton(configuration: PhotonConfiguration | undefined): ServiceStrategy<SearchArgs, LocationSuggestions>[] {
  if (configuration?.enabled) {
    logger.info("[Address Search] Registering Photon with %d instances.", configuration.instanceUrls.length);
    return configuration.instanceUrls.map(instanceUrl => ({
      name: `photon:${instanceUrl}`,
      execute: (query: string, deviceLocation?: Coordinates | undefined, signal?: AbortSignal | undefined): Promise<LocationSuggestions> =>
        fetchLocationFromPhoton(query, instanceUrl, configuration, deviceLocation, signal)
    }));
  } else {
    logger.info("[Address Search] Photon is disabled or unconfigured.");
    return [];
  }
}

const CACHE_KEY_PREFIX = "address-search";
function buildCacheKey(query: string, locationBias: Coordinates | undefined): string {
  const normalizedQuery = query.toLowerCase().trim();
  if (locationBias) {
    const rounded = roundCoordinates(locationBias);
    return `${CACHE_KEY_PREFIX}:${normalizedQuery}:${rounded?.latitude},${rounded?.longitude}`;
  } else {
    return `${CACHE_KEY_PREFIX}:${normalizedQuery}`;
  }
}

async function readCache(keyStore: KVNamespace | undefined, cacheKey: string | undefined): Promise<LocationSuggestions | undefined> {
  if (keyStore && cacheKey) {
    try {
      const cached = await keyStore.get(cacheKey);
      if (cached) {
        const results = JSON.parse(cached) as LocationSuggestions;
        logger.trace("[Address Search] Cache hit for '%s'. Returning %d cached results.", cacheKey, results?.locations?.length);
        return results;
      }
    } catch (error) {
      logger.warn("[Address Search] Cache read error for '%s': %s", cacheKey, error);
      return undefined;
    }
  } else {
    return undefined;
  }
}

async function writeCache(
  keyStore: KVNamespace | undefined,
  cacheKey: string | undefined,
  ttlSeconds: number | undefined,
  suggestions: LocationSuggestions
) {
  if (keyStore && cacheKey && suggestions.locations.length > 0) {
    keyStore.put(cacheKey, JSON.stringify(suggestions), { expirationTtl: ttlSeconds }).catch(error => {
      logger.warn("[Address Search] Cache write error for '%s': %s", cacheKey, error);
    });
  }
}
