import type { ExtendedPrismaClient } from "@features/db.server";
import { TRIPADVISOR_SOURCE_NAME, type TripAdvisorLocation } from "@features/tripadvisor.server";
import type { RestaurantMatchingAttempt } from "@persistence/client";


export function registerAttemptToFindTripAdvisorLocationById(
  locationId: string,
  restaurantId: string,
  found: TripAdvisorLocation | undefined,
  prisma: ExtendedPrismaClient
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
  found: TripAdvisorLocation | undefined,
  prisma: ExtendedPrismaClient
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
