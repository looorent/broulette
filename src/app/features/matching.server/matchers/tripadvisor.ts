import type { ExtendedPrismaClient } from "@features/db.server";
import { hasReachedQuota, registerAttemptToFindTripAdvisorLocationById, registerAttemptToFindTripAdvisorLocationNearBy } from "@features/rate-limiting.server";
import { filterTags } from "@features/tag.server";
import { findTripAdvisorLocationByIdWithRetry, searchTripAdvisorLocationNearbyWithRetry, TRIPADVISOR_SOURCE_NAME, type TripAdvisorConfiguration, type TripAdvisorLocation } from "@features/tripadvisor.server";
import { type Restaurant, type RestaurantProfile } from "@persistence/client";

import type { RestaurantAndProfiles, RestaurantMatchingConfiguration } from "../types";
import { type Matcher, type Matching } from "./types";

export class TripAdvisorMatcher implements Matcher {
  readonly source = TRIPADVISOR_SOURCE_NAME;

  constructor(readonly configuration: TripAdvisorConfiguration) { }

  async matchAndEnrich(
    restaurant: RestaurantAndProfiles,
    prisma: ExtendedPrismaClient,
    matchingConfiguration: RestaurantMatchingConfiguration,
    language: string,
    signal?: AbortSignal | undefined
  ): Promise<Matching> {
    const profile = restaurant.profiles.find(profile => profile.source === this.source);
    const tripAdvisor = await this.findTripAdvisorRestaurant(restaurant, profile, language, prisma, signal);
    if (tripAdvisor) {
      return {
        matched: true,
        restaurant: profile ? await this.updateProfile(restaurant, profile, tripAdvisor, prisma, matchingConfiguration) : await this.createProfile(tripAdvisor, restaurant, prisma, matchingConfiguration)
      }
    } else {
      return {
        matched: false,
        restaurant: restaurant,
        error: "not_found"
      };
    }
  }

  async hasReachedQuota(prisma: ExtendedPrismaClient): Promise<boolean> {
    return await hasReachedQuota(this.configuration.rateLimiting.maxNumberOfAttemptsPerMonth, this.source, prisma);
  }

  private async findTripAdvisorRestaurant(
    restaurant: Restaurant,
    existingProfile: RestaurantProfile | undefined,
    language: string,
    prisma: ExtendedPrismaClient,
    signal?: AbortSignal | undefined
  ): Promise<TripAdvisorLocation | undefined> {
    if (existingProfile) {
      const found = await findTripAdvisorLocationByIdWithRetry(existingProfile.externalId, language, this.configuration, signal);
      await registerAttemptToFindTripAdvisorLocationById(existingProfile.externalId, existingProfile.restaurantId, found, prisma);
      return found;
    } else {
      const textQuery = restaurant.name;
      if (textQuery && textQuery.length > 0) {
        const found = await searchTripAdvisorLocationNearbyWithRetry(
          textQuery,
          restaurant.latitude,
          restaurant.longitude,
          this.configuration.search.radiusInMeters,
          language,
          this.configuration,
          signal
        );
        await registerAttemptToFindTripAdvisorLocationNearBy(textQuery, restaurant.latitude, restaurant.longitude, this.configuration.search.radiusInMeters, restaurant.id, found, prisma);
        return found;
      } else {
        return undefined;
      }
    }
  }

  private async updateProfile(
    restaurant: RestaurantAndProfiles,
    profile: RestaurantProfile,
    tripAdvisor: TripAdvisorLocation,
    prisma: ExtendedPrismaClient,
    matchingConfiguration: RestaurantMatchingConfiguration
  ): Promise<RestaurantAndProfiles> {
    const updatedProfile = await prisma.restaurantProfile.update({
      data: this.merge(restaurant, tripAdvisor, profile, matchingConfiguration),
      where: { id: profile.id }
    });

    return {
      ...restaurant,
      profiles: restaurant.profiles.map(profile => profile.id === updatedProfile.id ? updatedProfile : profile)
    };
  }

  private async createProfile(
    tripAdvisor: TripAdvisorLocation,
    restaurant: RestaurantAndProfiles,
    prisma: ExtendedPrismaClient,
    matchingConfiguration: RestaurantMatchingConfiguration
  ): Promise<RestaurantAndProfiles> {
    const newProfile = await prisma.restaurantProfile.create({
      data: this.merge(restaurant, tripAdvisor, undefined, matchingConfiguration),
    });
    return {
      ...restaurant,
      profiles: [...restaurant.profiles, newProfile]
    };
  }

  private merge(
    restaurant: Restaurant,
    tripAdvisor: TripAdvisorLocation,
    profile: RestaurantProfile | undefined,
    matchingConfiguration: RestaurantMatchingConfiguration
  ) {
    return {
      restaurantId: restaurant.id,
      source: this.source,
      externalId: tripAdvisor.id.toString(),
      externalType: "location",
      version: (profile?.version || 0) + 1,
      latitude: tripAdvisor.latitude ?? restaurant.latitude!,
      longitude: tripAdvisor.longitude ?? restaurant.longitude!,
      name: tripAdvisor.name || profile?.name || null,
      address: tripAdvisor.address?.addressString || profile?.address || null,
      countryCode: tripAdvisor.address?.country || profile?.countryCode || null,
      state: tripAdvisor.address?.state || profile?.state || null, // undefined at tripAdvisor
      description: tripAdvisor.description || profile?.description || null,
      imageUrl: tripAdvisor.imageUrl || profile?.imageUrl || null,
      mapUrl: profile?.mapUrl || null,
      rating: tripAdvisor.rating || profile?.rating || null,
      ratingCount: tripAdvisor.rating || profile?.ratingCount || null,
      phoneNumber: tripAdvisor.phone || profile?.phoneNumber || null,
      internationalPhoneNumber: tripAdvisor.phone || profile?.internationalPhoneNumber || null,
      priceRange: profile?.priceRange || null,
      priceLabel: tripAdvisor.priceLevel || profile?.priceLabel || null,
      openingHours: tripAdvisor.openingHours || profile?.openingHours || null,
      tags: filterTags(tripAdvisor.cuisine?.map(c => c.name) || profile?.tags, matchingConfiguration.tags) || [],
      operational: profile?.operational ?? null,
      website: tripAdvisor.website || profile?.website || null,
      sourceUrl: tripAdvisor.tripAdvisorUrl || profile?.sourceUrl || null
    } as const;
  }
}
