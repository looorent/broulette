import prisma from "@features/db.server/prisma";
import { filterTags } from "@features/tag.server";
import { isOlderThanAMonth } from "@features/utils/date";
import type { Restaurant } from "@persistence/client";
import { registeredMatchers } from "./matchers/registry";
import type { Matching } from "./matchers/types";
import { DEFAULT_MATCHING_CONFIGURATION, type RestaurantMatchingConfiguration, type RestaurantAndProfiles } from "./types";
import type { DiscoveredRestaurantProfile } from "@features/discovery.server";

export async function enrichRestaurant(
  discovered: DiscoveredRestaurantProfile | undefined,
  configuration: RestaurantMatchingConfiguration = DEFAULT_MATCHING_CONFIGURATION,
  signal?: AbortSignal | undefined
): Promise<RestaurantAndProfiles | null> {
  if (discovered) {
    const restaurant = await findRestaurantInDatabase(discovered) || await saveRestaurantToDatabase(discovered, configuration);
    if (shouldBeMatched(restaurant)) {
      return await enrich(restaurant, configuration, signal);
    } else {
      return restaurant;
    }
  } else {
    return null;
  }
}

async function enrich(
  restaurant: RestaurantAndProfiles,
  configuration: RestaurantMatchingConfiguration,
  signal?: AbortSignal | undefined
): Promise<RestaurantAndProfiles> {
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
      currentResult = await matcher.matchAndEnrich(currentResult.restaurant, configuration, signal);
    }
  }

  return currentResult.restaurant;
}

function shouldBeMatched(restaurant: Restaurant): boolean {
  return restaurant
    && (!restaurant.matched || isOlderThanAMonth(restaurant.updatedAt));
}

async function findRestaurantInDatabase(identity: DiscoveredRestaurantProfile) {
  return prisma.restaurant.findFirst({
    where: {
      profiles: {
        some: {
          externalId: identity.externalId,
          externalType: identity.externalType,
          source: identity.source
        }
      }
    },
    include: {
      profiles: true
    }
  });
}

async function saveRestaurantToDatabase(
  discovered: DiscoveredRestaurantProfile,
  configuration: RestaurantMatchingConfiguration
): Promise<RestaurantAndProfiles> {
  // TODO we should save the profile
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
      profiles: true
    }
  });
}
