import type { Coordinates } from "@features/coordinate";
import { buildMapLink } from "@features/map";
import { fetchAllRestaurantsNearbyWithRetry, OVERPASS_SOURCE_NAME } from "@features/overpass.server";
import { DEFAULT_DISCOVERY_CONFIGURATION, type DiscoveredRestaurant, type DiscoveredRestaurantIdentity, type DiscoveryConfiguration, type DiscoveryConfigurationRange } from "./types";


export async function findRestaurantsFromOverpass(
  nearBy: Coordinates,
  rangeInMeters: number,
  timeoutInMs: number,
  identitiesToExclude: DiscoveredRestaurantIdentity[] = [],
  configuration: DiscoveryConfiguration = DEFAULT_DISCOVERY_CONFIGURATION,
  signal?: AbortSignal | undefined
): Promise<DiscoveredRestaurant[]> {
  if (configuration.engine.overpass) {
    const idsToExclude = identitiesToExclude
      .filter(Boolean)
      .filter(id => id.source === OVERPASS_SOURCE_NAME)
      .map(id => ({ osmId: id.externalId, osmType: id.type }));

    // TODO Refactor with load balancer
    const response = await fetchAllRestaurantsNearbyWithRetry(nearBy.latitude, nearBy.longitude, rangeInMeters, configuration.engine.overpass.instanceUrls[0], timeoutInMs / 1000, idsToExclude, signal);
    return (response?.restaurants || [])
      .map(restaurant => ({
        name: restaurant.name,
        coordinates: restaurant.location,
        identity: {
          source: OVERPASS_SOURCE_NAME,
          type: restaurant.type,
          externalId: restaurant.id.toString()
        },
        countryCode: restaurant.countryCode,
        addressState: restaurant.addressState,
        formattedAddress: restaurant.formattedAddress,
        website: restaurant.website,
        description: restaurant.description,
        phoneNumber: restaurant.phoneNumber,
        internationalPhoneNumber: restaurant.phoneNumber,
        tags: restaurant.cuisine && restaurant.cuisine?.length > 0 ? restaurant.cuisine?.split(";") || [] : [],
        openingHours: restaurant.openingHours,
        mapUrl: buildMapLink(restaurant.location.latitude, restaurant.location.longitude, restaurant.name)
      })
    );
  } else {
    return [];
  }
}
