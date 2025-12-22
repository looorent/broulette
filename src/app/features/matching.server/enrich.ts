import prisma from "@features/db.server/prisma";
import type { DiscoveredRestaurantProfile } from "@features/discovery.server";
import { filterTags } from "@features/tag.server";
import { isOlderThanAMonth, thirtyDaysAgo } from "@features/utils/date";
import { registeredMatchers } from "./matchers/registry";
import type { Matcher } from "./matchers/types";
import { DEFAULT_MATCHING_CONFIGURATION, type RestaurantAndProfiles, type RestaurantMatchingConfiguration } from "./types";

// TODO we should find the best language based on the location?
export async function enrichRestaurant(
  discovered: DiscoveredRestaurantProfile | undefined,
  language: string,
  configuration: RestaurantMatchingConfiguration = DEFAULT_MATCHING_CONFIGURATION,
  signal?: AbortSignal | undefined
): Promise<RestaurantAndProfiles | null> {
  if (discovered) {
    const restaurant = await findRestaurantInDatabase(discovered) || await saveRestaurantToDatabase(discovered, configuration);
    return await enrich(restaurant, language, configuration, signal);
  } else {
    return null;
  }
}

async function enrich(
  restaurant: RestaurantAndProfiles,
  language: string,
  configuration: RestaurantMatchingConfiguration,
  signal?: AbortSignal | undefined
): Promise<RestaurantAndProfiles> {
  let result = restaurant;

  for (const matcher of registeredMatchers) {
    if (signal?.aborted) {
      throw signal.reason;
    }

    // TODO we could parallelize
    if (await shouldBeMatched(result, matcher)) {
      result = (await matcher.matchAndEnrich(result, configuration, language, signal))?.restaurant;
    }
  }

  return result;
}

async function shouldBeMatched(
  restaurant: RestaurantAndProfiles,
  matcher: Matcher
): Promise<boolean> {
  const lastUpdate = restaurant
    .profiles
    .filter(profile => profile.source === matcher.source)
    .map(profile => profile.updatedAt)
    .reduce((updatedAt, otherUpdatedAt) => (updatedAt > otherUpdatedAt ? updatedAt : otherUpdatedAt));

  return (!lastUpdate || !isOlderThanAMonth(lastUpdate))
    && !await matcher.hasReachedQuota()
    && !await prisma.restaurantMatchingAttempt.existsSince(thirtyDaysAgo(), restaurant.id, matcher.source);
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
  return await prisma.restaurant.create({
    data: {
      name: discovered.name || null,
      latitude: discovered.latitude,
      longitude: discovered.longitude,
      profiles: {
        create: {
          ...discovered,
          version: 1,
          tags: filterTags(discovered.tags, configuration.tags)
        }
      }
    },
    include: {
      profiles: true
    }
  });
}
