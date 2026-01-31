import { LoadBalancer } from "@features/balancer.server";
import type { Coordinates } from "@features/coordinate";
import { fetchAllRestaurantsNearbyWithRetry, OVERPASS_SOURCE_NAME, type OverpassConfiguration } from "@features/overpass.server";
import { logger } from "@features/utils/logger";

import { fromOverpass } from "./factory";
import type { DiscoveredRestaurantProfile, DiscoveryRestaurantIdentity } from "./types";

let LOAD_BALANCER: LoadBalancer<[
  Coordinates,
  number,
  number,
  DiscoveryRestaurantIdentity[],
  AbortSignal?
], DiscoveredRestaurantProfile[]> | null = null;

export function loadBalancer(
  overpass: OverpassConfiguration | undefined
) {
  if (!LOAD_BALANCER) {
    LOAD_BALANCER = new LoadBalancer([
      ...registerOverpass(overpass)
    ]);
    logger.info("[Discovery] Load Balancer initialized with %d active strategies.", LOAD_BALANCER.numberOfProviders);
  }
  return LOAD_BALANCER;
}

function registerOverpass(configuration: OverpassConfiguration | undefined) {
  if (configuration?.enabled) {
    logger.log("[Discovery] Registering Overpass with %d instances", configuration.instanceUrls.length);
    return configuration.instanceUrls
      .map(instanceUrl => ({
        name: `overpass:${instanceUrl}`,
        execute: async (nearBy: Coordinates, distanceRangeInMeters: number, timeoutInSeconds: number, identitiesToExclude: DiscoveryRestaurantIdentity[], signal?: AbortSignal | undefined) => {
          const idsToExclude = identitiesToExclude
            .filter(Boolean)
            .filter(id => id.source === OVERPASS_SOURCE_NAME)
            .map(id => ({ osmId: id.externalId, osmType: id.externalType }));

          logger.trace("[Discovery] Executing %s | Center: [%f, %f] | Radius: %dm | Excluded: %d", instanceUrl, nearBy.latitude, nearBy.longitude, distanceRangeInMeters, idsToExclude.length);

          const response = await fetchAllRestaurantsNearbyWithRetry(nearBy.latitude, nearBy.longitude, distanceRangeInMeters, instanceUrl, timeoutInSeconds, idsToExclude, configuration.failover, signal);

          const results = (response?.restaurants || []).map(fromOverpass).filter(Boolean);
          logger.trace("[Discovery] Finished %s | Found: %d restaurants", instanceUrl, results.length);

          return results;
        }
      }));
  } else {
    logger.log("[Discovery] Overpass service is disabled");
    return [];
  }
}
