import { SearchCandidateStatus, ServiceTimeslot, type SearchCandidate } from "~/generated/prisma/client";
import prisma from "../db/prisma";
import { RestaurantDiscoveryScanner, type SearchDiscoveryConfig } from "./discovery.server";
import { enrichRestaurant } from "./enrich.server";
import { randomize } from "./randomization.server";
import { validateRestaurant } from "./validation.service";

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
    (search.candidates || []).flatMap(candidate => candidate.restaurant?.identities || [])
  );

  const instant = computeTargetInstant(search.serviceDate, search.serviceTimeslot);
  const latestOrder = (search.candidates || []).reduce((max, candidate) => Math.max(max, candidate.order), 0);
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
        restaurant.identities.forEach(discovery.addIdentityToExclude);
      }
    }
  }
  return candidateFound;
}

function computeTargetInstant(date: Date, timeslot: ServiceTimeslot): Date {
  switch (timeslot) {
    case ServiceTimeslot.Lunch:
      var target = new Date(date);
      target.setHours(12, 30, 0, 0);
      return target;
    case ServiceTimeslot.Dinner:
      var target = new Date(date);
      target.setHours(19, 30, 0, 0);
      return target;
    default:
      return new Date();
  }
}

