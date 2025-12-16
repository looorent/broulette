import { GOOGLE_PLACE_SOURCE_NAME } from "@config/server";
import prisma from "@features/db.server/prisma";
import type { GoogleRestaurant } from "@features/google.server";
import type { RestaurantMatchingAttempt } from "@persistence/client";
import { countMatchingAttemptsDuringMonth } from "./core";

export async function hasGooglePlaceReachedQuota(maxNumberOfAttemptsPerMonth: number): Promise<boolean> {
  const numberOfAttemptsThisMonth = await countMatchingAttemptsDuringMonth(GOOGLE_PLACE_SOURCE_NAME, new Date());
  if (numberOfAttemptsThisMonth < maxNumberOfAttemptsPerMonth) {
    console.warn(`We have exceeded the monthly quota of Google: ${numberOfAttemptsThisMonth}/${maxNumberOfAttemptsPerMonth}`);
    return true;
  } else {
    return false;
  }
}

export function registerAttemptToGooglePlaceById(
  placeId: string,
  restaurantId: string,
  found: GoogleRestaurant | undefined
): Promise<RestaurantMatchingAttempt> {
  return prisma.restaurantMatchingAttempt.create({
    data: {
      queryType: "id",
      source: GOOGLE_PLACE_SOURCE_NAME,
      found: found !== undefined && found !== null,
      restaurantId: restaurantId,
      query: placeId?.toString()
    }
  });
}

export function registerAttemptToGooglePlaceByText(query: string,
  latitude: number,
  longitude: number,
  searchRadiusInMeters: number,
  restaurantId: string,
  found: GoogleRestaurant | undefined
): Promise<RestaurantMatchingAttempt> {
  return prisma.restaurantMatchingAttempt.create({
    data: {
      queryType: "text",
      source: GOOGLE_PLACE_SOURCE_NAME,
      found: found !== undefined && found !== null,
      restaurantId: restaurantId,
      query: query,
      latitude: latitude,
      longitude: longitude,
      radius: searchRadiusInMeters
    }
  });
}
