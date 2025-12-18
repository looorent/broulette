import prisma from "@features/db.server/prisma";
import { RestaurantDiscoveryScanner } from "@features/discovery.server";
import { enrichRestaurant } from "@features/matching.server";
import { DistanceRange, Prisma, SearchCandidateStatus, ServiceTimeslot, type RestaurantIdentity, type SearchCandidate } from "@persistence/client";
import { SearchNotFoundError } from "./error";
import { randomize } from "./randomization/randomizer";
import type { SearchEngineConfiguration, SearchEngineRange } from "./types";
import { validateRestaurant } from "./validation/validator";

// TODO profiling
export async function searchCandidate(
  searchId: string,
  configuration: SearchEngineConfiguration,
  signal?: AbortSignal | undefined
): Promise<SearchCandidate | null> {
  const search = await findSearchOrThrow(searchId);

  const discovery = createDiscoveryScanner(search, configuration);

  const instant = computeTargetInstant(search.serviceDate, search.serviceTimeslot);

  let order = (search.candidates || []).reduce((max, candidate) => Math.max(max, candidate.order), 0) + 1;
  let candidateFound: SearchCandidate | null = null;
  while ((!candidateFound || candidateFound.status !== SearchCandidateStatus.Returned) && !discovery.isOver) {
    const restaurants = await discovery.nextRestaurants(signal);
    const randomized = await randomize(restaurants);

    // TODO logging
    while (randomized.length > 0 && (!candidateFound || candidateFound.status !== SearchCandidateStatus.Returned)) {
      const restaurant = await enrichRestaurant(randomized.shift(), configuration.matching);
      if (restaurant) {
        const status = await validateRestaurant(restaurant, instant);
        candidateFound = await prisma.searchCandidate.create({
          data: {
            searchId: searchId,
            restaurantId: restaurant.id,
            order: order++,
            status: status.valid ? SearchCandidateStatus.Returned : SearchCandidateStatus.Rejected,
            rejectionReason: status.rejectionReason
          }
        });
        restaurant.identities.forEach(identity => discovery.addIdentityToExclude(identity));
      }
    }
  }

  // TODO if the restaurant is the same than the previous, mark the search as exhausted and do not create a new candidate, just go back to the previous one.
  await markSearchAsExhausted(search.id, candidateFound);
  return candidateFound;
}

async function markSearchAsExhausted(searchId: string, candidateFound: SearchCandidate | null) {
  if (!candidateFound || candidateFound.status === SearchCandidateStatus.Rejected) {
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
  search: Prisma.SearchGetPayload<{ include: { candidates: { include: { restaurant: { include: { identities: true } } } }}}>,
  configuration: SearchEngineConfiguration
): RestaurantDiscoveryScanner {
  const { timeoutInMs, rangeInMeters } = defineRange(search.distanceRange, configuration);
  return new RestaurantDiscoveryScanner(
    { latitude: search.latitude, longitude: search.longitude },
    rangeInMeters,
    timeoutInMs,
    configuration.discovery,
    (search.candidates || []).flatMap(({ restaurant }: { restaurant: { identities: RestaurantIdentity[] } | undefined | null }) => restaurant?.identities || [])
  );
}

async function findSearchOrThrow(searchId: string) {
  const search = await prisma.search.findUniqueWithRestaurantAndIdentities(searchId);
  if (!search) {
    throw new SearchNotFoundError(searchId);
  }
  return search;
}
