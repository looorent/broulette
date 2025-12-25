import { LoadBalancer } from "@features/balancer.server";
import type { Coordinates } from "@features/coordinate";
import { fetchAllRestaurantsNearbyWithRetry, OVERPASS_SOURCE_NAME, type OverpassConfiguration } from "@features/overpass.server";

import { fromOverpass } from "./factory";
import type { DiscoveredRestaurantProfile, DiscoveryRestaurantIdentity } from "./types";

export const LOAD_BALANCER = new LoadBalancer<[
  Coordinates,
  number,
  number,
  DiscoveryRestaurantIdentity[],
  AbortSignal ?
], DiscoveredRestaurantProfile[]>();

export function registerOverpass(configuration: OverpassConfiguration | undefined) {
  if (configuration) {
    configuration.instanceUrls
      .map(instanceUrl => ({
        name: `overpass:${instanceUrl}`,
        execute: async (nearBy: Coordinates, distanceRangeInMeters: number, timeoutInSeconds: number, identitiesToExclude: DiscoveryRestaurantIdentity[], signal?: AbortSignal | undefined) => {
          const idsToExclude = identitiesToExclude
            .filter(Boolean)
            .filter(id => id.source === OVERPASS_SOURCE_NAME)
            .map(id => ({ osmId: id.externalId, osmType: id.externalType }));
          const response = await fetchAllRestaurantsNearbyWithRetry(nearBy.latitude, nearBy.longitude, distanceRangeInMeters, instanceUrl, timeoutInSeconds, idsToExclude, signal);
          return (response?.restaurants || []).map(fromOverpass).filter(Boolean);
        }
      }))
      .forEach(provider => LOAD_BALANCER.addProvider(provider));
  }
}
