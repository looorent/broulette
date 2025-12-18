import prisma from "@features/db.server/prisma";
import { RestaurantDiscoveryScanner } from "@features/discovery.server";
import { enrichRestaurant } from "@features/matching.server";
import type { RestaurantIdentity } from "@persistence/browser";
import { DistanceRange, SearchCandidateStatus, ServiceTimeslot, type SearchCandidate } from "@persistence/client";
import { SearchNotFoundError } from "./error";
import { randomize } from "./randomization/randomizer";
import type { SearchEngineConfiguration, SearchEngineRange } from "./types";
import { validateRestaurant } from "./validation/validator";

export async function searchCandidate(
  searchId: string,
  configuration: SearchEngineConfiguration,
  signal?: AbortSignal
): Promise<SearchCandidate | undefined> {
  const search = await findSearchOrThrow(searchId);

  if (search.exhausted) {
    return await findLatestCandidateOf(search.id);
  } else {
    const scanner = createDiscoveryScanner(search, configuration);
    const targetTime = computeTargetInstant(search.serviceDate, search.serviceTimeslot);
    const startingOrder = computeNextCandidateOrder(search.candidates);
    const finalCandidate = await findNextValidCandidate( searchId, scanner, configuration, targetTime, startingOrder, signal);
    await markSearchAsExhaustedIfNecessary(search.id, finalCandidate);
    return finalCandidate;
  }
}

async function findNextValidCandidate(
  searchId: string,
  scanner: RestaurantDiscoveryScanner,
  config: SearchEngineConfiguration,
  targetTime: Date,
  currentOrder: number,
  signal?: AbortSignal
): Promise<SearchCandidate | undefined> {
  let candidate: SearchCandidate | undefined = undefined;
  let orderTracker = currentOrder;

  while (shouldContinueSearching(candidate, scanner)) {
    const restaurants = await scanner.nextRestaurants(signal);
    const randomized = await randomize(restaurants);

    for (const restaurant of randomized) {
      if (!shouldContinueSearching(candidate, scanner)) {
        const processed = await processRestaurant(restaurant, searchId, orderTracker++, config, targetTime, scanner);
        if (processed) {
          candidate = processed;
        }
      } else {
        break;
      }
    }
  }
  return candidate;
}

async function processRestaurant(
  rawRestaurant: any,
  searchId: string,
  order: number,
  config: SearchEngineConfiguration,
  targetTime: Date,
  scanner: RestaurantDiscoveryScanner
): Promise<SearchCandidate | undefined> {
  const restaurant = await enrichRestaurant(rawRestaurant, config.matching);
  if (restaurant) {
    const validation = await validateRestaurant(restaurant, targetTime);
    const newCandidate = await prisma.searchCandidate.create({
      data: {
        searchId,
        restaurantId: restaurant.id,
        order,
        status: validation.valid ? SearchCandidateStatus.Returned : SearchCandidateStatus.Rejected,
        rejectionReason: validation.rejectionReason
      }
    });
    restaurant.identities.forEach(id => scanner.addIdentityToExclude(id));
    return newCandidate;
  } else {
    return undefined;
  }
}

function shouldContinueSearching(candidate: SearchCandidate | undefined, scanner: RestaurantDiscoveryScanner): boolean {
  const foundValid = candidate?.status === SearchCandidateStatus.Returned;
  return !foundValid && !scanner.isOver;
}

function computeNextCandidateOrder(candidates: { order: number }[] = []): number {
  const maxOrder = candidates.reduce((max, c) => Math.max(max, c.order), 0);
  return maxOrder + 1;
}

async function markSearchAsExhaustedIfNecessary(searchId: string, finalCandidateFound: SearchCandidate | undefined) {
  if (!finalCandidateFound || finalCandidateFound.status === SearchCandidateStatus.Rejected) {
    await prisma.search.update({
      data: { exhausted: true },
      where: { id: searchId }
    });
  }
}

function computeTargetInstant(date: Date, timeslot: ServiceTimeslot): Date {
  const target = new Date(date);
  switch (timeslot) {
    case ServiceTimeslot.Lunch:
      target.setHours(12, 30, 0, 0);
      break;
    case ServiceTimeslot.Dinner:
      target.setHours(19, 30, 0, 0);
      break;
    default:
      return new Date();
  }
  return target;
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
        identities: RestaurantIdentity[]
      }
    }[] | undefined
  },
  configuration: SearchEngineConfiguration
): RestaurantDiscoveryScanner {
  const { timeoutInMs, rangeInMeters } = defineRange(search.distanceRange, configuration);
  return new RestaurantDiscoveryScanner(
    { latitude: search.latitude, longitude: search.longitude },
    rangeInMeters,
    timeoutInMs,
    configuration.discovery,
    (search.candidates || []).flatMap(candidate => candidate?.restaurant?.identities || [])
  );
}

async function findSearchOrThrow(searchId: string) {
  const search = await prisma.search.findUniqueWithRestaurantAndIdentities(searchId);
  if (!search) {
    throw new SearchNotFoundError(searchId);
  }
  return search;
}

async function findLatestCandidateOf(searchId: string): Promise<SearchCandidate | undefined> {
  const finalCandidateId = (await prisma.search.findWithLatestCandidate(searchId))?.candidates?.[0]?.id;
  const finalCandidate = await prisma.searchCandidate.findUnique({ where: { id: finalCandidateId } });
  return finalCandidate ?? undefined;
}

