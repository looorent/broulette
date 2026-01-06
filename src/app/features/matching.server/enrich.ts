import { type MatchingRepository, type RestaurantAndProfiles, type RestaurantRepository } from "@features/db.server";
import type { DiscoveredRestaurantProfile } from "@features/discovery.server";
import { DEFAULT_GOOGLE_PLACE_CONFIGURATION, GOOGLE_PLACE_SOURCE_NAME, type GooglePlaceConfiguration } from "@features/google.server";
import { OVERPASS_SOURCE_NAME } from "@features/overpass.server";
import { filterTags } from "@features/tag.server";
import { DEFAULT_TRIPADVISOR_CONFIGURATION, TRIPADVISOR_SOURCE_NAME, type TripAdvisorConfiguration } from "@features/tripadvisor.server";
import { isOlderThanAMonth, thirtyDaysAgo } from "@features/utils/date";

import { registeredMatchers } from "./matchers/registry";
import type { Matcher } from "./matchers/types";
import { DEFAULT_MATCHING_CONFIGURATION, type RestaurantMatchingConfiguration } from "./types";

// TODO we should find the best language based on the location?
export async function enrichRestaurant(
  discovered: DiscoveredRestaurantProfile | undefined,
  language: string,
  restaurantRepository: RestaurantRepository,
  matchingRepository: MatchingRepository,
  configuration: RestaurantMatchingConfiguration = DEFAULT_MATCHING_CONFIGURATION,
  google: GooglePlaceConfiguration | undefined = DEFAULT_GOOGLE_PLACE_CONFIGURATION,
  tripAdvisor: TripAdvisorConfiguration | undefined = DEFAULT_TRIPADVISOR_CONFIGURATION,
  signal?: AbortSignal | undefined
): Promise<RestaurantAndProfiles | undefined> {
  if (discovered) {
    const restaurant = await restaurantRepository.findRestaurantWithExternalIdentity(discovered.externalId, discovered.externalType, discovered.source) || await restaurantRepository.createRestaurantFromDiscovery(discovered, filterTags(discovered.tags, configuration.tags));
    return await enrich(restaurant, language, restaurantRepository, matchingRepository, configuration, google, tripAdvisor, signal);
  } else {
    return undefined;
  }
}

async function enrich(
  restaurant: RestaurantAndProfiles,
  language: string,
  restaurantRepository: RestaurantRepository,
  matchingRepository: MatchingRepository,
  configuration: RestaurantMatchingConfiguration,
  google?: GooglePlaceConfiguration | undefined,
  tripAdvisor?: TripAdvisorConfiguration | undefined,
  signal?: AbortSignal | undefined
): Promise<RestaurantAndProfiles> {
  let result = restaurant;

  for (const matcher of registeredMatchers(google, tripAdvisor)) {
    if (signal?.aborted) {
      throw signal.reason;
    }

    // We could parallelize.
    // However, every iteration has side-effects, so this is not so useful.
    if (await shouldBeMatched(result, matcher, matchingRepository)) {
      result = (await matcher.matchAndEnrich(result, restaurantRepository, matchingRepository, configuration, language, signal))?.restaurant;
    }
  }

  return completeRestaurantFromProfiles(result);
}

async function shouldBeMatched(
  restaurant: RestaurantAndProfiles,
  matcher: Matcher,
  matchingRepository: MatchingRepository
): Promise<boolean> {
  const relevantDates = restaurant.profiles
    .filter(profile => profile.source === matcher.source)
    .map(profile => profile.updatedAt);

  const lastUpdate = relevantDates.length > 0
    ? relevantDates.reduce((latest, current) => (current > latest ? current : latest))
    : undefined;

  return (!lastUpdate || !isOlderThanAMonth(lastUpdate))
    && !await matcher.hasReachedQuota(matchingRepository)
    && !await matchingRepository.doesAttemptExistsSince(thirtyDaysAgo(), restaurant.id, matcher.source);
}

function completeRestaurantFromProfiles(restaurant: RestaurantAndProfiles): RestaurantAndProfiles {
  const overpass = restaurant.profiles.find(profile => profile.source === OVERPASS_SOURCE_NAME);
  const tripAdvisor = restaurant.profiles.find(profile => profile.source === TRIPADVISOR_SOURCE_NAME);
  const google = restaurant.profiles.find(profile => profile.source === GOOGLE_PLACE_SOURCE_NAME);
  return {
    ...restaurant,
    name: google?.name || tripAdvisor?.name || overpass?.name || restaurant?.name,
    latitude: google?.latitude || tripAdvisor?.latitude || overpass?.latitude || restaurant?.latitude,
    longitude: google?.longitude || tripAdvisor?.longitude || overpass?.longitude || restaurant?.longitude
  };
}
