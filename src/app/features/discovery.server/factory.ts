import { OVERPASS_SOURCE_NAME, type OverpassRestaurant } from "@features/overpass.server";
import { Prisma } from "@persistence/client";
import type { DiscoveredRestaurantProfile } from "./types";

export function fromOverpass(overpass: OverpassRestaurant): DiscoveredRestaurantProfile {
  return {
    source: OVERPASS_SOURCE_NAME,
    externalType: overpass.type,
    externalId: overpass.id.toString(),

    latitude: toDecimal(overpass.latitude)!,
    longitude: toDecimal(overpass.longitude)!,

    name: overpass.name || null,
    address: overpass.formattedAddress || null,
    countryCode: overpass.countryCode || null,
    state: overpass.addressState || null,
    description: overpass.description || null,
    imageUrl: overpass.imageUrl || null,
    mapUrl: overpass.openStreetMapUrl || null,
    rating: null,
    ratingCount: null,
    phoneNumber: overpass.phoneNumber || null,
    internationalPhoneNumber: overpass.phoneNumber || null,
    priceRange: null,
    priceLabel: null,
    openingHours: overpass.openingHours || null,
    tags: buildTagsFrom(overpass),
    operational: overpass.operational,
    website: overpass.website || null,
    sourceUrl: overpass.openStreetMapUrl || null
  };
}

function buildTagsFrom(overpass: OverpassRestaurant): string[] {
  const tags = overpass.cuisine || [];
  if (overpass.vegan === "yes" || overpass.vegan === "only") {
    tags.push("vegan");
  }

  if (overpass.vegetarian === "yes" || overpass.vegetarian === "only") {
    tags.push("vegetarian");
  }

  return Array.from(new Set(tags));
}

function toDecimal(value: number | undefined | null): Prisma.Decimal | undefined {
  if (value === null || value === undefined) {
    return undefined;
  } else {
    return new Prisma.Decimal(value);
  }
}
