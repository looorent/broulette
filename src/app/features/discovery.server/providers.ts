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
  AbortSignal ?
], DiscoveredRestaurantProfile[]> | null = null;
export function loadBalancer(
  overpass: OverpassConfiguration | undefined
) {
  if (!LOAD_BALANCER) {
    LOAD_BALANCER = new LoadBalancer([
      ...registerOverpass(overpass)
    ]);
  }
  return LOAD_BALANCER;
}

function registerOverpass(configuration: OverpassConfiguration | undefined) {
  if (configuration?.enabled) {
    return configuration.instanceUrls
      .map(instanceUrl => ({
        name: `overpass:${instanceUrl}`,
        execute: async (nearBy: Coordinates, distanceRangeInMeters: number, timeoutInSeconds: number, identitiesToExclude: DiscoveryRestaurantIdentity[], signal?: AbortSignal | undefined) => {
          const idsToExclude = identitiesToExclude
            .filter(Boolean)
            .filter(id => id.source === OVERPASS_SOURCE_NAME)
            .map(id => ({ osmId: id.externalId, osmType: id.externalType }));
          const response = await fetchAllRestaurantsNearbyWithRetry(nearBy.latitude, nearBy.longitude, distanceRangeInMeters, instanceUrl, timeoutInSeconds, idsToExclude, configuration.failover, signal);
          return (response?.restaurants || []).map(fromOverpass).filter(Boolean);
        }
      }));
  } else {
    return [];
  }
}
