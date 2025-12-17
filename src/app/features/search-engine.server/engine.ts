import prisma from "@features/db.server/prisma";
import { DistanceRange, SearchCandidateStatus, ServiceTimeslot, type RestaurantIdentity, type SearchCandidate } from "@persistence/client";
import { RestaurantDiscoveryScanner } from "./discovery/scanner";
import { SearchNotFoundError } from "./error";
import { enrichRestaurant } from "./matching/core";
import { randomize } from "./randomization/randomizer";
import type { SearchEngineConfiguration } from "./types";
import { validateRestaurant } from "./validation/validator";
import type { DiscoveryConfiguration, DiscoveryConfigurationRange } from "@features/discovery.server";

function defineRange(range: DistanceRange, configuration: DiscoveryConfiguration): DiscoveryConfigurationRange {
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

// TODO profiling
export async function searchCandidate(
  searchId: string,
  configuration: SearchEngineConfiguration,
  signal?: AbortSignal | undefined
): Promise<SearchCandidate | null> {
  const search = await prisma.search.findUniqueWithRestaurantAndIdentities(searchId); // TODO repository?
  if (!search) {
    throw new SearchNotFoundError(searchId);
  }


  const { timeoutInMs, rangeInMeters } = defineRange(range, configuration);

  const discovery = new RestaurantDiscoveryScanner(
    { latitude: search.latitude, longitude: search.longitude },
    configuration.discovery,
    signal,
    (search.candidates || []).flatMap(({ restaurant }: { restaurant: { identities: RestaurantIdentity[] } | undefined | null }) => restaurant?.identities || [])
  );

  const instant = computeTargetInstant(search.serviceDate, search.serviceTimeslot);
  const latestOrder = (search.candidates || []).reduce((max: number, candidate: { order: number }) => Math.max(max, candidate.order), 0);
  let order = latestOrder;

  let candidateFound: SearchCandidate | null = null;
  while ((!candidateFound || candidateFound.status !== SearchCandidateStatus.Returned) && !discovery.isOver) {
    const restaurants = await discovery.nextRestaurants();
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
