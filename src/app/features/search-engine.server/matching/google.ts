import { GOOGLE_PLACE_SOURCE_NAME } from "@config";
import prisma from "@features/db.server/prisma";
import { findGoogleRestaurantById, searchGoogleRestaurantByText, type GoogleRestaurant } from "@features/google.server";
import { registerAttemptToGooglePlaceById, registerAttemptToGooglePlaceByText } from "@features/rate-limiting.server";
import { thirtyDaysAgo } from "@features/utils/date";
import { Prisma } from "@persistence/client";
import type { Matcher, RestaurantMatchingConfig, RestaurantWithIdentities } from "./types";

export const GOOGLE_MATCHER: Matcher = {
  source: GOOGLE_PLACE_SOURCE_NAME,
  matchAndEnrich: async (restaurant: RestaurantWithIdentities, configuration: RestaurantMatchingConfig) => {
    let enriched = restaurant;
    if (configuration.google.enabled) {
      const alreadyAttemptedRecently = await prisma.restaurantMatchingAttempt.existsSince(thirtyDaysAgo(), restaurant.id, GOOGLE_PLACE_SOURCE_NAME);
      if (!alreadyAttemptedRecently) {
        enriched = await enrichWithGoogle(restaurant, configuration);
      }
    }
    return {
      success: enriched.matched,
      restaurant: enriched
    };
  }
}

async function enrichWithGoogle(
  restaurant: RestaurantWithIdentities,
  configuration: RestaurantMatchingConfig
): Promise<RestaurantWithIdentities> {
  const googleIdentity = restaurant.identities.find(identity => identity.source === GOOGLE_PLACE_SOURCE_NAME);
  let googleRestaurant: GoogleRestaurant | undefined;
  if (googleIdentity) {
    googleRestaurant = await findGoogleRestaurantById(googleIdentity.externalId, configuration.google.apiKey, configuration.google.retry);
    await registerAttemptToGooglePlaceById(googleIdentity.externalId, restaurant.id, googleRestaurant);
  } else {
    const query = restaurant.name;
    googleRestaurant = await searchGoogleRestaurantByText(
      query,
      restaurant.latitude,
      restaurant.longitude,
      configuration.google.searchRadiusInMeters,
      configuration.google.apiKey,
      configuration.google.timeOutInMilliseconds,
      configuration.google.similarity
    );
    await registerAttemptToGooglePlaceByText(query, restaurant.latitude, restaurant.longitude, configuration.google.searchRadiusInMeters, restaurant.id, googleRestaurant);

    if (googleRestaurant) {
      const newIdentity = await prisma.restaurantIdentity.create({
        data: {
          source: GOOGLE_PLACE_SOURCE_NAME,
          restaurantId: restaurant.id,
          type: "google_place_api", // Other APIs have a "type" (node, way, etc)
          externalId: googleRestaurant.id
        }
      })
      restaurant.identities.push(newIdentity);
    }
  }

  return updateRestaurantWithGoogle(googleRestaurant, restaurant);
}

async function updateRestaurantWithGoogle(
  google: GoogleRestaurant | undefined,
  restaurant: RestaurantWithIdentities
): Promise<RestaurantWithIdentities> {
  if (google) {
    return await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: {
        name: google.displayName ?? google.name ?? restaurant.name,
        latitude: google.location?.latitude ?? restaurant.latitude,
        longitude: google.location?.longitude ?? restaurant.longitude,
        version: restaurant.version + 1,
        address: google.formattedAddress ?? google.shortFormattedAddress ?? restaurant.address,
        rating: (google.rating ? new Prisma.Decimal(google.rating) : null) ?? restaurant.rating,
        ratingCount: google.userRatingCount !== null && google.userRatingCount !== undefined ? google.userRatingCount : undefined,
        phoneNumber: google.nationalPhoneNumber ?? restaurant.phoneNumber,
        internationalPhoneNumber: google.internationalPhoneNumber ?? restaurant.internationalPhoneNumber,
        priceRange: google.priceLevel ?? restaurant.priceRange,
        tags: google.types ?? restaurant.tags,
        openingHours: google.openingHours || restaurant.openingHours,
        countryCode: google.countryCode || restaurant.countryCode,
        sourceWebpage: google.googleMapsUri,
        website: google.websiteUri ?? restaurant.website,
        operational: google.operational,
        matched: true,
        // description: restaurant.description,
        // imageUrl: restaurant.imageUrl, TODO
      },
      include: {
        identities: true
      }
    });
  } else {
    return restaurant;
  }
}
