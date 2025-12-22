import prisma from "@features/db.server/prisma";
import { GOOGLE_PLACE_SOURCE_NAME, type GoogleRestaurant } from "@features/google.server";
import type { RestaurantMatchingAttempt } from "@persistence/client";

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
