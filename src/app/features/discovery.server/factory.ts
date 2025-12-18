import { buildMapLink } from "@features/map";
import { OVERPASS_SOURCE_NAME, type OverpassRestaurant } from "@features/overpass.server";
import type { DiscoveredRestaurant } from "./types";

export function fromOverpass(restaurant: OverpassRestaurant): DiscoveredRestaurant {
  return {
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
  };
}
