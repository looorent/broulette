import prisma from "@features/db.server/prisma";
import { findGoogleRestaurantById, GOOGLE_PLACE_SOURCE_NAME, searchGoogleRestaurantByText, type GooglePlaceConfiguration, type GoogleRestaurant } from "@features/google.server";
import { buildMapLink } from "@features/map";
import { registerAttemptToGooglePlaceById, registerAttemptToGooglePlaceByText } from "@features/rate-limiting.server";
import { thirtyDaysAgo } from "@features/utils/date";
import { Prisma } from "@persistence/client";
import type { Matcher, RestaurantMatchingConfig, RestaurantWithIdentities } from "./types";

export const GOOGLE_MATCHER: Matcher = {
  source: GOOGLE_PLACE_SOURCE_NAME,
  matchAndEnrich: async (restaurant: RestaurantWithIdentities, configuration: RestaurantMatchingConfig, signal?: AbortSignal | undefined) => {
    let enriched = restaurant;
    if (configuration.google) {
      const alreadyAttemptedRecently = await prisma.restaurantMatchingAttempt.existsSince(thirtyDaysAgo(), restaurant.id, GOOGLE_PLACE_SOURCE_NAME);
      if (!alreadyAttemptedRecently) {
        enriched = await enrichWithGoogle(restaurant, configuration.google, signal);
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
  configuration: GooglePlaceConfiguration,
  signal?: AbortSignal | undefined
): Promise<RestaurantWithIdentities> {
  const googleIdentity = restaurant.identities.find(identity => identity.source === GOOGLE_PLACE_SOURCE_NAME);
  let googleRestaurant: GoogleRestaurant | undefined;
  if (googleIdentity) {
    googleRestaurant = await findGoogleRestaurantById(googleIdentity.externalId, configuration, signal);
    await registerAttemptToGooglePlaceById(googleIdentity.externalId, restaurant.id, googleRestaurant);
  } else {
    const query = restaurant.name;
    googleRestaurant = await searchGoogleRestaurantByText(
      query,
      restaurant.latitude,
      restaurant.longitude,
      configuration.search.radiusInMeters,
      configuration,
      configuration.similarity,
      signal
    );
    await registerAttemptToGooglePlaceByText(query, restaurant.latitude, restaurant.longitude, configuration.search.radiusInMeters, restaurant.id, googleRestaurant);

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
    const name = google.displayName ?? restaurant.name;
    const latitude = google.location?.latitude ?? restaurant.latitude;
    const longitude = google.location?.longitude ?? restaurant.longitude;
    const mapUrl = google.googleMapsUri ?? buildMapLink(latitude, longitude, name);
    return await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: {
        name: name,
        latitude: latitude,
        longitude: longitude,
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
        mapUrl: mapUrl ?? restaurant.mapUrl,
        website: google.websiteUri ?? restaurant.website,
        operational: google.operational,
        matched: true,
        description: restaurant.description,
        imageUrl: google.photoUrl ?? restaurant.imageUrl
      },
      include: {
        identities: true
      }
    });
  } else {
    return restaurant;
  }
}
