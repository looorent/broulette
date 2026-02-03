import { LoadBalancer, type ServiceStrategy } from "@features/balancer.server";
import type { Coordinates } from "@features/coordinate";
import { fetchLocationFromNominatim, type NominatimConfiguration } from "@features/nominatim.server";
import { fetchLocationFromPhoton, type PhotonConfiguration } from "@features/photon.server";
import type { LocationSuggestions } from "@features/search";
import { logger } from "@features/utils/logger";

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
  signal?: AbortSignal | undefined
): Promise<LocationSuggestions> {
  logger.log("[Address Search] Executing search for query: '%s'%s", query, deviceLocation ? ` with location bias (${deviceLocation.latitude}, ${deviceLocation.longitude})` : "");
  try {
    const results = await loadBalancer(nominatim, photon).execute(query, deviceLocation, signal);
    logger.log("[Address Search] Found %d results for '%s'", results?.locations?.length, query);
    return results;
  } catch (error) {
    logger.error("[Address Search] Error searching for '%s': %s", query, error);
    throw error;
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
