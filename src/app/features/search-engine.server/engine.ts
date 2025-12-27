import { type ExtendedPrismaClient } from "@features/db.server/prisma";
import { RestaurantDiscoveryScanner, type DiscoveredRestaurantProfile } from "@features/discovery.server";
import { DEFAULT_GOOGLE_PLACE_CONFIGURATION, type GooglePlaceConfiguration } from "@features/google.server";
import { enrichRestaurant } from "@features/matching.server";
import { DEFAULT_OVERPASS_CONFIGURATION, type OverpassConfiguration } from "@features/overpass.server";
import { DEFAULT_TRIPADVISOR_CONFIGURATION, type TripAdvisorConfiguration } from "@features/tripadvisor.server";
import { DistanceRange, SearchCandidateStatus, type RestaurantProfile, type Search, type SearchCandidate } from "@persistence/client";

import { SearchNotFoundError } from "./error";
import { randomize } from "./randomizer";
import { DEFAULT_SEARCH_ENGINE_CONFIGURATION, type SearchEngineConfiguration, type SearchEngineRange } from "./types";
import { validateRestaurant } from "./validator";

export async function searchCandidate(
  searchId: string,
  locale: string,
  prisma: ExtendedPrismaClient,
  configuration: SearchEngineConfiguration = DEFAULT_SEARCH_ENGINE_CONFIGURATION,
  overpass: OverpassConfiguration | undefined = DEFAULT_OVERPASS_CONFIGURATION,
  google: GooglePlaceConfiguration | undefined = DEFAULT_GOOGLE_PLACE_CONFIGURATION,
  tripAdvisor: TripAdvisorConfiguration | undefined = DEFAULT_TRIPADVISOR_CONFIGURATION,
  signal?: AbortSignal
): Promise<SearchCandidate> {
  const search = await findSearchOrThrow(searchId, prisma);

  if (search.exhausted) {
    return await findLatestCandidateOf(search.id, prisma) || await createDefaultCandidateWithoutRestaurant(search.id, prisma);
  } else {
    const scanner = createDiscoveryScanner(search, configuration, overpass);
    const startingOrder = computeNextCandidateOrder(search.candidates);
    const finalCandidate = await findNextValidCandidate(search, scanner, configuration, startingOrder, locale, prisma, google, tripAdvisor, signal);
    await markSearchAsExhaustedIfNecessary(search.id, finalCandidate, prisma);
    return finalCandidate;
  }
}

async function findNextValidCandidate(
  search: Search,
  scanner: RestaurantDiscoveryScanner,
  config: SearchEngineConfiguration,
  currentOrder: number,
  locale: string,
  prisma: ExtendedPrismaClient,
  google: GooglePlaceConfiguration | undefined,
  tripAdvisor: TripAdvisorConfiguration | undefined,
  signal?: AbortSignal
): Promise<SearchCandidate> {
  let candidate: SearchCandidate | undefined = undefined;
  let orderTracker = currentOrder;

  while (shouldContinueSearching(candidate, scanner)) {
    const restaurants = await scanner.nextRestaurants(signal);
    const randomized = await randomize(restaurants);

    for (const restaurant of randomized) {
      if (shouldContinueSearching(candidate, scanner)) {
        const processed = await processRestaurant(restaurant, search, orderTracker++, config, prisma, google, tripAdvisor, locale, scanner);
        if (processed) {
          candidate = processed;
        }
      } else {
        break;
      }
    }
  }
  return candidate || createDefaultCandidateWithoutRestaurant(search.id, prisma);
}

async function processRestaurant(
  discovered: DiscoveredRestaurantProfile,
  search: Search,
  order: number,
  configuration: SearchEngineConfiguration,
  prisma: ExtendedPrismaClient,
  google: GooglePlaceConfiguration | undefined,
  tripAdvisor: TripAdvisorConfiguration | undefined,
  locale: string,
  scanner: RestaurantDiscoveryScanner
): Promise<SearchCandidate | undefined> {
  const restaurant = await enrichRestaurant(discovered, locale, prisma, configuration.matching, google, tripAdvisor);
  const validation = await validateRestaurant(restaurant, search, locale);
  const newCandidate = await prisma.searchCandidate.create({
    data: {
      searchId: search.id,
      restaurantId: restaurant?.id,
      order,
      status: validation.valid ? SearchCandidateStatus.Returned : SearchCandidateStatus.Rejected,
      rejectionReason: validation.rejectionReason
    }
  });

  if (restaurant) {
    restaurant.profiles.forEach(profile => scanner.addIdentityToExclude(profile));
  }
  return newCandidate;
}

function shouldContinueSearching(candidate: SearchCandidate | undefined, scanner: RestaurantDiscoveryScanner): boolean {
  const foundValid = candidate?.status === SearchCandidateStatus.Returned;
  return !foundValid && !scanner.isOver;
}

function computeNextCandidateOrder(candidates: { order: number }[] = []): number {
  const maxOrder = candidates.reduce((max, c) => Math.max(max, c.order), 0);
  return maxOrder + 1;
}

async function markSearchAsExhaustedIfNecessary(
  searchId: string,
  finalCandidateFound: SearchCandidate | undefined,
  prisma: ExtendedPrismaClient
) {
  if (!finalCandidateFound || finalCandidateFound.status === SearchCandidateStatus.Rejected) {
    await prisma.search.update({
      data: { exhausted: true },
      where: { id: searchId }
    });
  }
}

function defineRange(range: DistanceRange, configuration: SearchEngineConfiguration): SearchEngineRange {
  switch (range) {
    case DistanceRange.Far:
      return configuration.range.far;
    case DistanceRange.MidRange:
      return configuration.range.midRange;
    default:
    case DistanceRange.Close:
      return configuration.range.close;
  }
}

function createDiscoveryScanner(
  search: {
    latitude: number;
    longitude: number;
    distanceRange: DistanceRange;
    candidates: {
      restaurant: {
        profiles: RestaurantProfile[]
      } | undefined | null
    }[] | undefined
  },
  configuration: SearchEngineConfiguration,
  overpass: OverpassConfiguration | undefined
): RestaurantDiscoveryScanner {
  const { timeoutInMs, rangeInMeters } = defineRange(search.distanceRange, configuration);
  return new RestaurantDiscoveryScanner(
    { latitude: search.latitude, longitude: search.longitude },
    rangeInMeters,
    timeoutInMs,
    configuration.discovery,
    overpass,
    (search.candidates || []).flatMap(candidate => candidate?.restaurant?.profiles || [])
  );
}

async function findSearchOrThrow(searchId: string, prisma: ExtendedPrismaClient) {
  const search = await prisma.search.findUniqueWithRestaurantAndProfiles(searchId);
  if (!search) {
    throw new SearchNotFoundError(searchId);
  }
  return search;
}

async function findLatestCandidateOf(searchId: string | undefined, prisma: ExtendedPrismaClient): Promise<SearchCandidate | undefined> {
  const finalCandidateId = (await prisma.search.findWithLatestCandidateId(searchId))?.latestCandidateId;
  const finalCandidate = finalCandidateId ? await prisma.searchCandidate.findUnique({ where: { id: finalCandidateId } }) : undefined;
  return finalCandidate || undefined;
}

async function createDefaultCandidateWithoutRestaurant(searchId: string, prisma: ExtendedPrismaClient): Promise<SearchCandidate> {
  const order = (await prisma.search.findWithLatestCandidateId(searchId))?.order || 0;
  return await prisma.searchCandidate.create({
    data: {
      searchId: searchId,
      order: order + 1,
      status: SearchCandidateStatus.Rejected,
      rejectionReason: "no_restaurant_found"
    }
  });
}
