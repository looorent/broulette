import prisma from "@features/db.server/prisma";
import { findGoogleRestaurantById, GOOGLE_PLACE_SOURCE_NAME, searchGoogleRestaurantByText, type GooglePlaceConfiguration, type GoogleRestaurant } from "@features/google.server";
import { buildMapLink } from "@features/map";
import { hasGooglePlaceReachedQuota, registerAttemptToGooglePlaceById, registerAttemptToGooglePlaceByText } from "@features/rate-limiting.server";
import { filterTags } from "@features/tag.server";
import { thirtyDaysAgo } from "@features/utils/date";
import { Prisma } from "@persistence/client";
import type { RestaurantMatchingConfiguration, RestaurantWithIdentities } from "../types";
import type { Matcher, Matching } from "./types";

export class GoogleMatcher implements Matcher {
  readonly source = GOOGLE_PLACE_SOURCE_NAME;

  constructor(readonly configuration: GooglePlaceConfiguration) {}

  async matchAndEnrich(
    restaurant: RestaurantWithIdentities,
    matchingConfiguration: RestaurantMatchingConfiguration,
    signal?: AbortSignal | undefined
  ): Promise<Matching> {
    let enriched = restaurant;
    const alreadyAttemptedRecently = await prisma.restaurantMatchingAttempt.existsSince(thirtyDaysAgo(), restaurant.id, this.source);
    if (!alreadyAttemptedRecently) {
      enriched = await this.enrichWithGoogle(restaurant, matchingConfiguration, signal);
    }
    return {
      success: enriched.matched,
      restaurant: enriched
    };
  }

  async hasReachedQuota(): Promise<boolean> {
    return await hasGooglePlaceReachedQuota(this.configuration.rateLimiting.maxNumberOfAttemptsPerMonth);
  }

  private async enrichWithGoogle(
    restaurant: RestaurantWithIdentities,
    matchingConfiguration: RestaurantMatchingConfiguration,
    signal?: AbortSignal | undefined
  ): Promise<RestaurantWithIdentities> {
    const googleIdentity = restaurant.identities.find(identity => identity.source === this.source);
    let googleRestaurant: GoogleRestaurant | undefined;
    if (googleIdentity) {
      googleRestaurant = await findGoogleRestaurantById(googleIdentity.externalId, this.configuration, signal);
      await registerAttemptToGooglePlaceById(googleIdentity.externalId, restaurant.id, googleRestaurant);
    } else {
      const query = restaurant.name;
      googleRestaurant = await searchGoogleRestaurantByText(
        query,
        restaurant.latitude,
        restaurant.longitude,
        this.configuration.search.radiusInMeters,
        this.configuration,
        this.configuration.similarity,
        signal
      );
      await registerAttemptToGooglePlaceByText(query, restaurant.latitude, restaurant.longitude, this.configuration.search.radiusInMeters, restaurant.id, googleRestaurant);

      if (googleRestaurant) {
        const newIdentity = await prisma.restaurantIdentity.create({
          data: {
            source: this.source,
            restaurantId: restaurant.id,
            type: "poi", // Other APIs have a "type" (node, way, etc)
            externalId: googleRestaurant.id
          }
        })
        restaurant.identities.push(newIdentity);
      }
    }

    return this.updateRestaurantWithGoogle(googleRestaurant, restaurant, matchingConfiguration);
  }

  private async updateRestaurantWithGoogle(
    google: GoogleRestaurant | undefined,
    restaurant: RestaurantWithIdentities,
    matchingConfiguration: RestaurantMatchingConfiguration
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
          priceLabel: google.priceLabel ?? restaurant.priceLabel,
          tags: filterTags(google.types ?? restaurant.tags, matchingConfiguration.tags),
          openingHours: google.openingHours || restaurant.openingHours,
          countryCode: google.countryCode || restaurant.countryCode,
          mapUrl: mapUrl ?? restaurant.mapUrl,
          website: google.websiteUri ?? restaurant.website,
          operational: google.operational,
          matched: true,
          description: restaurant.description, // TODO no way to get a nice description?
          sourceWebpage: google.googleMapsUri ?? restaurant.sourceWebpage,
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
}
