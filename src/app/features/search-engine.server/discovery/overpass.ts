import { OVERPASS_SOURCE_NAME } from "@config";
import type { Coordinates } from "@features/coordinate";
import { fetchAllRestaurantsNearbyWithRetry } from "@features/overpass.server";
import { type DiscoveredRestaurant, type DiscoveredRestaurantIdentity, type SearchDiscoveryConfig } from "./types";

export async function findRestaurantsFromOverpass(
  nearBy: Coordinates,
  rangeInMeters: number,
  identitiesToExclude: DiscoveredRestaurantIdentity[],
  configuration: SearchDiscoveryConfig
): Promise<DiscoveredRestaurant[]> {
  const idsToExclude = identitiesToExclude
    .filter(Boolean)
    .filter(id => id.source === OVERPASS_SOURCE_NAME)
    .map(id => ({ osmId: id.externalId, osmType: id.type }));

  const response = await fetchAllRestaurantsNearbyWithRetry(nearBy.latitude, nearBy.longitude, rangeInMeters, idsToExclude, configuration.overpass.instanceUrl, configuration.overpass.timeoutInSeconds);
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
      openingHours: restaurant.openingHours
    })
  );
}
