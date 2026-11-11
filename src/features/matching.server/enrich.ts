import type { DiscoveredRestaurantProfile } from "@features/discovery.server";
import { DEFAULT_GOOGLE_PLACE_CONFIGURATION, GOOGLE_PLACE_SOURCE_NAME, type GooglePlaceConfiguration } from "@features/google.server";
import type { ImageUploader } from "@features/image-storage.server";
import { OVERPASS_SOURCE_NAME } from "@features/overpass.server";
import { filterTags } from "@features/tag.server";
import { DEFAULT_TRIPADVISOR_CONFIGURATION, TRIPADVISOR_SOURCE_NAME, type TripAdvisorConfiguration } from "@features/tripadvisor.server";
import { isOlderThanTwoMonths, sixtyDaysAgo } from "@features/utils/date";
import { isAbortError } from "@features/utils/error";
import { logger } from "@features/utils/logger";
import { type MatchingRepository, type RestaurantAndProfiles, type RestaurantRepository } from "@persistence";

import { registeredMatchers } from "./matchers/registry";
import type { Matcher, Matching } from "./matchers/types";
import { DEFAULT_MATCHING_CONFIGURATION, type RestaurantMatchingConfiguration } from "./types";

// TODO we should find the best language based on the location?
export async function enrichRestaurant(
  discovered: DiscoveredRestaurantProfile | undefined,
  language: string,
  restaurantRepository: RestaurantRepository,
  matchingRepository: MatchingRepository,
  imageUploader: ImageUploader,
  configuration: RestaurantMatchingConfiguration = DEFAULT_MATCHING_CONFIGURATION,
  google: GooglePlaceConfiguration | undefined = DEFAULT_GOOGLE_PLACE_CONFIGURATION,
  tripAdvisor: TripAdvisorConfiguration | undefined = DEFAULT_TRIPADVISOR_CONFIGURATION,
  signal?: AbortSignal | undefined
): Promise<RestaurantAndProfiles | undefined> {
  if (discovered) {
    const restaurant = await restaurantRepository.findRestaurantWithExternalIdentity(discovered.externalId, discovered.externalType, discovered.source) || await restaurantRepository.createRestaurantFromDiscovery(discovered, filterTags(discovered.tags, configuration.tags));
    return await enrich(restaurant, language, restaurantRepository, matchingRepository, imageUploader, configuration, google, tripAdvisor, signal);
  } else {
    return undefined;
  }
}

async function enrich(
  restaurant: RestaurantAndProfiles,
  language: string,
  restaurantRepository: RestaurantRepository,
  matchingRepository: MatchingRepository,
  imageUploader: ImageUploader,
  configuration: RestaurantMatchingConfiguration,
  google: GooglePlaceConfiguration | undefined,
  tripAdvisor: TripAdvisorConfiguration | undefined,
  signal?: AbortSignal | undefined
): Promise<RestaurantAndProfiles> {
  if (signal?.aborted) {
    throw signal.reason;
  }

  const matchers = registeredMatchers(google, tripAdvisor, imageUploader);
  const primaryMatchers = matchers.filter(matcher => !matcher.onlyAsFallback);
  const fallbackMatchers = matchers.filter(matcher => matcher.onlyAsFallback);
  const primarySources = primaryMatchers.map(matcher => matcher.source);

  const enriched = await matchWith(primaryMatchers, restaurant, restaurantRepository, matchingRepository, configuration, language, signal);
  const hasPrimaryProfile = enriched.profiles.some(profile => primarySources.includes(profile.source));

  return completeRestaurantFromProfiles(hasPrimaryProfile
    ? enriched
    : await matchWith(fallbackMatchers, enriched, restaurantRepository, matchingRepository, configuration, language, signal));
}

/** Runs the eligible matchers concurrently and returns the restaurant with the profiles they matched. */
async function matchWith(
  matchers: Matcher[],
  restaurant: RestaurantAndProfiles,
  restaurantRepository: RestaurantRepository,
  matchingRepository: MatchingRepository,
  configuration: RestaurantMatchingConfiguration,
  language: string,
  signal?: AbortSignal | undefined
): Promise<RestaurantAndProfiles> {
  const eligibility = await Promise.all(
    matchers.map(matcher => shouldBeMatched(restaurant, matcher, matchingRepository))
  );
  const eligibleMatchers = matchers.filter((_, index) => eligibility[index]);

  const matchings = await Promise.all(
    eligibleMatchers.map(matcher =>
      matchAndEnrichOrSkip(matcher, restaurant, restaurantRepository, matchingRepository, configuration, language, signal)
    )
  );

  const matchedProfiles = matchings.flatMap((matching, index) =>
    matching.matched
      ? matching.restaurant.profiles.filter(p => p.source === eligibleMatchers[index].source)
      : []
  );
  const mergedProfiles = Object.values(
    Object.fromEntries([...restaurant.profiles, ...matchedProfiles].map(p => [p.id, p]))
  );

  return { ...restaurant, profiles: mergedProfiles };
}

// Enrichment is best effort: an unavailable source must not prevent the restaurant from being proposed.
async function matchAndEnrichOrSkip(
  matcher: Matcher,
  restaurant: RestaurantAndProfiles,
  restaurantRepository: RestaurantRepository,
  matchingRepository: MatchingRepository,
  configuration: RestaurantMatchingConfiguration,
  language: string,
  signal?: AbortSignal | undefined
): Promise<Matching> {
  try {
    return await matcher.matchAndEnrich(restaurant, restaurantRepository, matchingRepository, configuration, language, signal);
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    logger.warn("[Matching] %s enrichment failed for restaurant %s. Skipping it. %s", matcher.source, restaurant.id, error);
    return { matched: false, restaurant, error: "unavailable" };
  }
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

  return (!lastUpdate || isOlderThanTwoMonths(lastUpdate))
    && !await matcher.hasReachedQuota(matchingRepository)
    && !await matchingRepository.doesAttemptExistSince(sixtyDaysAgo(), restaurant.id, matcher.source);
}

function completeRestaurantFromProfiles(restaurant: RestaurantAndProfiles): RestaurantAndProfiles {
  const overpass = restaurant.profiles.find(profile => profile.source === OVERPASS_SOURCE_NAME);
  const tripAdvisor = restaurant.profiles.find(profile => profile.source === TRIPADVISOR_SOURCE_NAME);
  const google = restaurant.profiles.find(profile => profile.source === GOOGLE_PLACE_SOURCE_NAME);
  return {
    ...restaurant,
    name: google?.name || tripAdvisor?.name || overpass?.name || restaurant?.name,
    latitude: google?.latitude ?? tripAdvisor?.latitude ?? overpass?.latitude ?? restaurant?.latitude,
    longitude: google?.longitude ?? tripAdvisor?.longitude ?? overpass?.longitude ?? restaurant?.longitude
  };
}
