import prisma from "@features/db.server/prisma";
import { TRIPADVISOR_SOURCE_NAME, type TripAdvisorLocation } from "@features/tripadvisor.server";
import type { RestaurantMatchingAttempt } from "@persistence/client";
import { countMatchingAttemptsDuringMonth } from "./core";

export async function hasTripAdvisorReachedQuota(maxNumberOfAttemptsPerMonth: number): Promise<boolean> {
  const numberOfAttemptsThisMonth = await countMatchingAttemptsDuringMonth(TRIPADVISOR_SOURCE_NAME, new Date());
  if (numberOfAttemptsThisMonth > maxNumberOfAttemptsPerMonth) {
    console.warn(`We have exceeded the monthly quota of TripAdvisor: ${numberOfAttemptsThisMonth}/${maxNumberOfAttemptsPerMonth}`);
    return true;
  } else {
    return false;
  }
}

export function registerAttemptToFindTripAdvisorLocationById(
  locationId: string,
  restaurantId: string,
  found: TripAdvisorLocation | undefined
): Promise<RestaurantMatchingAttempt> {
  return prisma.restaurantMatchingAttempt.create({
    data: {
      queryType: "id",
      source: TRIPADVISOR_SOURCE_NAME,
      found: found !== undefined && found !== null,
      restaurantId: restaurantId,
      query: locationId?.toString()
    }
  });
}

export function registerAttemptToFindTripAdvisorLocationNearBy(query: string,
  latitude: number,
  longitude: number,
  searchRadiusInMeters: number,
  restaurantId: string,
  found: TripAdvisorLocation | undefined
): Promise<RestaurantMatchingAttempt> {
  return prisma.restaurantMatchingAttempt.create({
    data: {
      queryType: "nearby",
      source: TRIPADVISOR_SOURCE_NAME,
      found: found !== undefined && found !== null,
      restaurantId: restaurantId,
      query: query,
      latitude: latitude,
      longitude: longitude,
      radius: searchRadiusInMeters
    }
  });
}
