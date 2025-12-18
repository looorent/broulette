import type { ServiceStrategy } from "@features/balancer.server";
import type { Coordinates } from "@features/coordinate";
import { fetchAllRestaurantsNearbyWithRetry, OVERPASS_SOURCE_NAME, type OverpassConfiguration } from "@features/overpass.server";
import { fromOverpass } from "./factory";
import type { DiscoveredRestaurant, DiscoveredRestaurantIdentity } from "./types";

export const registeredProviders: ServiceStrategy<[
  Coordinates,
  number,
  number,
  DiscoveredRestaurantIdentity[],
  AbortSignal?
], DiscoveredRestaurant[]>[] = [];

export function registerOverpass(configuration: OverpassConfiguration | undefined) {
  if (configuration) {
    configuration.instanceUrls
      .map(instanceUrl => ({
        name: `overpass:${instanceUrl}`,
        execute: async (nearBy: Coordinates, distanceRangeInMeters: number, timeoutInSeconds: number, identitiesToExclude: DiscoveredRestaurantIdentity[], signal?: AbortSignal | undefined) => {
          const idsToExclude = identitiesToExclude
            .filter(Boolean)
            .filter(id => id.source === OVERPASS_SOURCE_NAME)
            .map(id => ({ osmId: id.externalId, osmType: id.type }));
          const response = await fetchAllRestaurantsNearbyWithRetry(nearBy.latitude, nearBy.longitude, distanceRangeInMeters, instanceUrl, timeoutInSeconds, idsToExclude, signal);
          return (response?.restaurants || []).map(fromOverpass).filter(Boolean);
        }
      }))
      .forEach(provider => registeredProviders.push(provider));
  }
}

