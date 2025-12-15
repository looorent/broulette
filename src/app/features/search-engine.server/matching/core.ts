import prisma from "@features/db.server/prisma";
import { isOlderThanAMonth } from "@features/utils/date";
import type { DiscoveredRestaurant, DiscoveredRestaurantIdentity } from "../discovery/types";
import { GOOGLE_MATCHER } from "./google";
import type { Matcher, Matching, RestaurantMatchingConfig, RestaurantWithIdentities } from "./types";

export async function enrichRestaurant(
  discovered: DiscoveredRestaurant | undefined,
  configuration: RestaurantMatchingConfig
): Promise<RestaurantWithIdentities | null> {
  if (discovered) {
    const restaurant = await findRestaurantInDatabase(discovered.identity) || await saveRestaurantToDatabase(discovered);
    if (shouldBeMatched(restaurant)) {
      return await enrich(restaurant, configuration);
    } else {
      return restaurant;
    }
  } else {
    return null;
  }
}

const MATCHERS: Matcher[] = [
  GOOGLE_MATCHER
];

async function enrich(
  restaurant: RestaurantWithIdentities,
  configuration: RestaurantMatchingConfig
): Promise<RestaurantWithIdentities> {
  let currentResult: Matching = {
    success: false,
    restaurant: restaurant
  };

  for (const matcher of MATCHERS) {
    if (currentResult.success) {
      break;
    } else {
      currentResult = await matcher.matchAndEnrich(currentResult.restaurant, configuration);
    }
  }

  return currentResult.restaurant;
}

function shouldBeMatched(restaurant: RestaurantWithIdentities): boolean {
  return restaurant
    && (!restaurant.matched || isOlderThanAMonth(restaurant.updatedAt));
}

function filterTags(tags: string[] | undefined): string[] {
  return tags || []; // TODO
}

async function findRestaurantInDatabase(identity: DiscoveredRestaurantIdentity) {
  return await prisma.restaurant.findFirst({
    where: {
      identities: {
        some: {
          externalId: identity.externalId,
          source: identity.source
        }
      }
    },
    include: {
      identities: true
    }
  });
}

async function saveRestaurantToDatabase(discovered: DiscoveredRestaurant) {
  return await prisma.restaurant.create({
    data: {
      name: discovered.name!,
      latitude: discovered.coordinates.latitude!,
      longitude: discovered.coordinates.longitude!,
      tags: filterTags(discovered.tags),
      address: discovered.formattedAddress,
      countryCode: discovered.countryCode,
      internationalPhoneNumber: discovered.internationalPhoneNumber,
      phoneNumber: discovered.phoneNumber,
      state: discovered.addressState,
      description: discovered.description,
      website: discovered.website,
      matched: false,
      openingHours: discovered.openingHours,
      identities: { create: discovered.identity }
    },
    include: {
      identities: true
    }
  });
}
