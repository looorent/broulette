import prisma from "@features/db.server/prisma";
import type { RestaurantIdentity, SearchCandidate } from "@persistence/client";
import { SearchCandidateStatus, ServiceTimeslot } from "@persistence/client";
import { RestaurantDiscoveryScanner, type SearchDiscoveryConfig } from "./discovery";
import { enrichRestaurant } from "./enrich";
import { SearchNotFoundError } from "./error";
import { randomize } from "./randomization";
import { validateRestaurant } from "./validation";

const ENV_CONFIG: SearchDiscoveryConfig = {
  initialDiscoveryRangeMeters: Number(import.meta.env.VITE_ENGINE_DEFAULT_INITIAL_DISCOVERY_RANGE_METERS ?? 5000),
  discoveryRangeIncreaseMeters: Number(import.meta.env.VITE_ENGINE_DEFAULT_DISCOVERY_RANGE_INCREASE_METERS ?? 3000),
  maxDiscoveryIterations: Number(import.meta.env.VITE_ENGINE_DEFAULT_MAX_DISCOVERY_ITERATIONS ?? 3)
};

export async function searchCandidate(
  searchId: string,
  discoveryConfiguration: SearchDiscoveryConfig = ENV_CONFIG
): Promise<SearchCandidate | null> {
  const search = await prisma.search.findUniqueWithRestaurantAndIdentities(searchId);
  if (!search) {
    throw new SearchNotFoundError(searchId);
  }

  const discovery = new RestaurantDiscoveryScanner(
    { latitude: search.latitude, longitude: search.longitude },
    discoveryConfiguration,
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
      const restaurant = await enrichRestaurant(randomized.shift());
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
