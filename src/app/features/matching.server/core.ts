import prisma from "@features/db.server/prisma";
import type { DiscoveredRestaurant, DiscoveredRestaurantIdentity } from "@features/discovery.server";
import { filterTags } from "@features/tag.server";
import { isOlderThanAMonth } from "@features/utils/date";
import type { Restaurant } from "@persistence/client";
import { registeredMatchers } from "./matchers/registry";
import type { Matching } from "./matchers/types";
import { DEFAULT_MATCHING_CONFIGURATION, type RestaurantMatchingConfiguration, type RestaurantWithIdentities } from "./types";

export async function enrichRestaurant(
  discovered: DiscoveredRestaurant | undefined,
  configuration: RestaurantMatchingConfiguration = DEFAULT_MATCHING_CONFIGURATION,
  signal?: AbortSignal | undefined
): Promise<RestaurantWithIdentities | null> {
  if (discovered) {
    const restaurant = await findRestaurantInDatabase(discovered.identity) || await saveRestaurantToDatabase(discovered, configuration);
    if (shouldBeMatched(restaurant)) {
      return await enrich(restaurant, signal);
    } else {
      return restaurant;
    }
  } else {
    return null;
  }
}

async function enrich(
  restaurant: RestaurantWithIdentities,
  signal?: AbortSignal | undefined
): Promise<RestaurantWithIdentities> {

  let currentResult: Matching = {
    success: false,
    restaurant: restaurant
  };

  for (const matcher of registeredMatchers) {
    if (signal?.aborted) {
      throw signal.reason;
    }

    if (currentResult.success) {
      break;
    } else if (!await matcher.hasReachedQuota()) {
      currentResult = await matcher.matchAndEnrich(currentResult.restaurant, signal);
    }
  }

  return currentResult.restaurant;
}

function shouldBeMatched(restaurant: Restaurant): boolean {
  return restaurant
    && (!restaurant.matched || isOlderThanAMonth(restaurant.updatedAt));
}

async function findRestaurantInDatabase(identity: DiscoveredRestaurantIdentity) {
  return prisma.restaurant.findFirst({
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

async function saveRestaurantToDatabase(
  discovered: DiscoveredRestaurant,
  configuration: RestaurantMatchingConfiguration
): Promise<RestaurantWithIdentities> {
  return await prisma.restaurant.create({
    data: {
      name: discovered.name!,
      latitude: discovered.coordinates.latitude!,
      longitude: discovered.coordinates.longitude!,
      tags: filterTags(discovered.tags, configuration.tags),
      address: discovered.formattedAddress,
      countryCode: discovered.countryCode,
      internationalPhoneNumber: discovered.internationalPhoneNumber,
      phoneNumber: discovered.phoneNumber,
      state: discovered.addressState,
      description: discovered.description,
      website: discovered.website,
      mapUrl: discovered.mapUrl,
      matched: false,
      openingHours: discovered.openingHours,
      identities: { create: discovered.identity }
    },
    include: {
      identities: true
    }
  });
}
