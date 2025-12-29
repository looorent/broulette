import { LoadBalancer } from "@features/balancer.server";
import type { Coordinates } from "@features/coordinate";
import { fetchAllRestaurantsNearbyWithRetry, OVERPASS_SOURCE_NAME, type OverpassConfiguration } from "@features/overpass.server";

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
    console.info(`[Discovery] Load Balancer initialized with ${LOAD_BALANCER.numberOfProviders} active strategies.`);
  }
  return LOAD_BALANCER;
}

function registerOverpass(configuration: OverpassConfiguration | undefined) {
  if (configuration?.enabled) {
    console.log(`[Discovery] Registering Overpass with ${configuration.instanceUrls.length} instances`);
    return configuration.instanceUrls
      .map(instanceUrl => ({
        name: `overpass:${instanceUrl}`,
        execute: async (nearBy: Coordinates, distanceRangeInMeters: number, timeoutInSeconds: number, identitiesToExclude: DiscoveryRestaurantIdentity[], signal?: AbortSignal | undefined) => {
          const idsToExclude = identitiesToExclude
            .filter(Boolean)
            .filter(id => id.source === OVERPASS_SOURCE_NAME)
            .map(id => ({ osmId: id.externalId, osmType: id.externalType }));

          console.trace(`[Discovery] Executing ${instanceUrl} | Center: [${nearBy.latitude}, ${nearBy.longitude}] | Radius: ${distanceRangeInMeters}m | Excluded: ${idsToExclude.length}`);

          const response = await fetchAllRestaurantsNearbyWithRetry(nearBy.latitude, nearBy.longitude, distanceRangeInMeters, instanceUrl, timeoutInSeconds, idsToExclude, configuration.failover, signal);

          const results = (response?.restaurants || []).map(fromOverpass).filter(Boolean);
          console.trace(`[Discovery] Finished ${instanceUrl} | Found: ${results.length} restaurants`);

          return results;
        }
      }));
  } else {
    console.log("[Discovery] Overpass service is disabled");
    return [];
  }
}
