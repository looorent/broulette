import type { MatchingRepository, RestaurantAndProfiles, RestaurantProfilePayload, RestaurantRepository } from "@features/db.server";
import { filterTags } from "@features/tag.server";
import { findTripAdvisorLocationByIdWithRetry, searchTripAdvisorLocationNearbyWithRetry, TRIPADVISOR_SOURCE_NAME, type TripAdvisorConfiguration, type TripAdvisorLocation } from "@features/tripadvisor.server";
import { type Restaurant, type RestaurantProfile } from "@persistence/client";

import type { RestaurantMatchingConfiguration } from "../types";
import { type Matcher, type Matching } from "./types";

export class TripAdvisorMatcher implements Matcher {
  readonly source = TRIPADVISOR_SOURCE_NAME;

  constructor(readonly configuration: TripAdvisorConfiguration) { }

  async matchAndEnrich(
    restaurant: RestaurantAndProfiles,
    restaurantRepository: RestaurantRepository,
    matchingRepository: MatchingRepository,
    matchingConfiguration: RestaurantMatchingConfiguration,
    language: string,
    signal?: AbortSignal | undefined
  ): Promise<Matching> {
    const profile = restaurant.profiles.find(profile => profile.source === this.source);
    const tripAdvisor = await this.findTripAdvisorRestaurant(restaurant, profile, language, matchingRepository, signal);
    if (tripAdvisor) {
      const newProfile = this.merge(restaurant, tripAdvisor, profile, matchingConfiguration);
      return {
        matched: true,
        restaurant: profile ? await restaurantRepository.updateProfile(profile.id, newProfile, restaurant) : await restaurantRepository.createProfile(newProfile, restaurant)
      }
    } else {
      return {
        matched: false,
        restaurant: restaurant,
        error: "not_found"
      };
    }
  }

  hasReachedQuota(matchingRepository: MatchingRepository): Promise<boolean> {
    return matchingRepository.hasReachedQuota(this.source, this.configuration.rateLimiting.maxNumberOfAttemptsPerMonth);
  }

  private async findTripAdvisorRestaurant(
    restaurant: Restaurant,
    existingProfile: RestaurantProfile | undefined,
    language: string,
    matchingRepository: MatchingRepository,
    signal?: AbortSignal | undefined
  ): Promise<TripAdvisorLocation | undefined> {
    if (existingProfile) {
      const found = await findTripAdvisorLocationByIdWithRetry(existingProfile.externalId, language, this.configuration, signal);
      await matchingRepository.registerAttemptToFindAMatch(existingProfile.externalId, "id", this.source, restaurant.id, found !== null && found !== undefined)
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
        await matchingRepository.registerAttemptToFindAMatch(textQuery, "nearby", this.source, restaurant.id, found !== null && found !== undefined, restaurant.latitude, restaurant.longitude, this.configuration.search.radiusInMeters);
        return found;
      } else {
        return undefined;
      }
    }
  }

  private merge(
    restaurant: Restaurant,
    tripAdvisor: TripAdvisorLocation,
    profile: RestaurantProfile | undefined,
    matchingConfiguration: RestaurantMatchingConfiguration
  ): RestaurantProfilePayload {
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
