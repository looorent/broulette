import prisma from "@features/db.server/prisma";
import { findGoogleRestaurantById, GOOGLE_PLACE_SOURCE_NAME, searchGoogleRestaurantByText, type GooglePlaceConfiguration, type GoogleRestaurant } from "@features/google.server";
import { hasReachedQuota, registerAttemptToGooglePlaceById, registerAttemptToGooglePlaceByText } from "@features/rate-limiting.server";
import { filterTags } from "@features/tag.server";
import { type Restaurant, type RestaurantProfile } from "@persistence/client";
import type { RestaurantAndProfiles, RestaurantMatchingConfiguration } from "../types";
import { toDecimal, type Matcher, type Matching } from "./types";

export class GoogleMatcher implements Matcher {
  readonly source = GOOGLE_PLACE_SOURCE_NAME;

  constructor(readonly configuration: GooglePlaceConfiguration) {}

  async matchAndEnrich(
    restaurant: RestaurantAndProfiles,
    matchingConfiguration: RestaurantMatchingConfiguration,
    _language: string,
    signal?: AbortSignal | undefined
  ): Promise<Matching> {

    const profile = restaurant.profiles.find(profile => profile.source === this.source);
    const google = await this.findGoogleRestaurant(restaurant, profile, signal);
    if (google) {
      return {
        matched: true,
        restaurant: profile ? await this.updateProfile(restaurant, profile, google, matchingConfiguration) : await this.createProfile(google, restaurant, matchingConfiguration)
      }
    } else {
      return {
        matched: false,
        restaurant: restaurant,
        error: "not_found"
      };
    }
  }

  async hasReachedQuota(): Promise<boolean> {
    return await hasReachedQuota(this.configuration.rateLimiting.maxNumberOfAttemptsPerMonth, this.source);
  }

  private async findGoogleRestaurant(
    restaurant: Restaurant,
    profile: RestaurantProfile | undefined,
    signal?: AbortSignal | undefined
  ): Promise<GoogleRestaurant | undefined> {
    if (profile) {
      const found = await findGoogleRestaurantById(profile.externalId, this.configuration, signal);
      await registerAttemptToGooglePlaceById(profile.externalId, profile.restaurantId, found);
      return found;
    } else {
      const textQuery = restaurant.name;
      if (textQuery && textQuery.length > 0) {
        const found = await searchGoogleRestaurantByText(
          textQuery,
          restaurant.latitude?.toNumber(),
          restaurant.longitude?.toNumber(),
          this.configuration,
          signal
        );
        await registerAttemptToGooglePlaceByText(textQuery, restaurant.latitude?.toNumber(), restaurant.longitude?.toNumber(), this.configuration.search.radiusInMeters, restaurant.id, found);
        return found;
      } else {
        return undefined;
      }
    }
  }

  private async updateProfile(
    restaurant: RestaurantAndProfiles,
    profile: RestaurantProfile,
    google: GoogleRestaurant,
    matchingConfiguration: RestaurantMatchingConfiguration
  ): Promise<RestaurantAndProfiles> {
    const updatedProfile = await prisma.restaurantProfile.update({
      data: this.merge(restaurant, google, profile, matchingConfiguration),
      where: { id: profile.id }
    });

    return {
      ...restaurant,
      profiles: restaurant.profiles.map(profile => profile.id === updatedProfile.id ? updatedProfile : profile)
    };
  }

  private async createProfile(
    google: GoogleRestaurant,
    restaurant: RestaurantAndProfiles,
    matchingConfiguration: RestaurantMatchingConfiguration
  ): Promise<RestaurantAndProfiles> {
    const newProfile = await prisma.restaurantProfile.create({
      data: this.merge(restaurant, google, undefined, matchingConfiguration),
    });
    return {
      ...restaurant,
      profiles: [...restaurant.profiles, newProfile]
    };
  }

  private merge(
    restaurant: Restaurant,
    google: GoogleRestaurant,
    profile: RestaurantProfile | undefined,
    matchingConfiguration: RestaurantMatchingConfiguration
  ) {
    return {
      restaurantId: restaurant.id,
      source: this.source,
      externalId: google.id,
      externalType: "place",
      version: (profile?.version || 0) + 1,
      latitude: toDecimal(google.latitude) ?? restaurant.latitude!,
      longitude: toDecimal(google.longitude) ?? restaurant.longitude!,
      name: google.displayName || profile?.name || null,
      address: google.formattedAddress || profile?.address || null,
      countryCode: google.countryCode || profile?.countryCode || null,
      state: profile?.state || null, // undefined at google
      description: profile?.description || null,
      imageUrl: google.photoUrl || profile?.imageUrl || null,
      mapUrl: google.googleMapsUri || profile?.mapUrl || null,
      rating: toDecimal(google.rating) || profile?.rating || null,
      ratingCount: google.userRatingCount || profile?.ratingCount || null,
      phoneNumber: google.nationalPhoneNumber || profile?.phoneNumber || null,
      internationalPhoneNumber: google.internationalPhoneNumber || profile?.internationalPhoneNumber || null,
      priceRange: google.priceLevel || profile?.priceRange || null,
      priceLabel: google.priceLabel || profile?.priceLabel || null,
      openingHours: google.openingHours || profile?.openingHours || null,
      tags: filterTags(google.types || profile?.tags, matchingConfiguration.tags) || [],
      operational: google.operational ?? profile?.operational ?? null,
      website: google.websiteUri || profile?.website || null,
      sourceUrl: google.googleMapsUri || profile?.sourceUrl || null
    } as const;
  }
}
