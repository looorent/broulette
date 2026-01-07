import { type Restaurant, type RestaurantProfile, type MatchingRepository, type RestaurantAndProfiles, type RestaurantProfilePayload, type RestaurantRepository } from "@persistence";

import { findGoogleRestaurantById, GOOGLE_PLACE_SOURCE_NAME, searchGoogleRestaurantByText, type GooglePlaceConfiguration, type GoogleRestaurant } from "@features/google.server";
import { filterTags } from "@features/tag.server";

import type { RestaurantMatchingConfiguration } from "../types";
import { type Matcher, type Matching } from "./types";

export class GoogleMatcher implements Matcher {
  readonly source = GOOGLE_PLACE_SOURCE_NAME;

  constructor(readonly configuration: GooglePlaceConfiguration) {}

  async matchAndEnrich(
    restaurant: RestaurantAndProfiles,
    restaurantRepository: RestaurantRepository,
    matchingRepository: MatchingRepository,
    matchingConfiguration: RestaurantMatchingConfiguration,
    _language: string,
    signal?: AbortSignal | undefined
  ): Promise<Matching> {
    const profile = restaurant.profiles.find(profile => profile.source === this.source);
    const google = await this.findGoogleRestaurant(restaurant, profile, matchingRepository, signal);
    if (google) {
      const newProfile = this.merge(restaurant, google, profile, matchingConfiguration);
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

  private async findGoogleRestaurant(
    restaurant: Restaurant,
    existingProfile: RestaurantProfile | undefined,
    matchingRepository: MatchingRepository,
    signal?: AbortSignal | undefined
  ): Promise<GoogleRestaurant | undefined> {
    if (existingProfile) {
      const found = await findGoogleRestaurantById(existingProfile.externalId, this.configuration, signal);
      await matchingRepository.registerAttemptToFindAMatch(existingProfile.externalId, "id", this.source, restaurant.id, found !== null && found !== undefined)
      return found;
    } else {
      const textQuery = restaurant.name;
      if (textQuery && textQuery.length > 0) {
        const found = await searchGoogleRestaurantByText(
          textQuery,
          restaurant.latitude,
          restaurant.longitude,
          this.configuration,
          signal
        );
        await matchingRepository.registerAttemptToFindAMatch(textQuery, "text", this.source, restaurant.id, found !== null && found !== undefined, restaurant.latitude, restaurant.longitude, this.configuration.search.radiusInMeters);
        return found;
      } else {
        return undefined;
      }
    }
  }

  private merge(
    restaurant: Restaurant,
    google: GoogleRestaurant,
    profile: RestaurantProfile | undefined,
    matchingConfiguration: RestaurantMatchingConfiguration
  ): RestaurantProfilePayload {
    return {
      restaurantId: restaurant.id,
      source: this.source,
      externalId: google.id,
      externalType: "place",
      version: (profile?.version || 0) + 1,
      latitude: google.latitude ?? restaurant.latitude!,
      longitude: google.longitude ?? restaurant.longitude!,
      name: google.displayName || profile?.name || null,
      address: google.formattedAddress || profile?.address || null,
      countryCode: google.countryCode || profile?.countryCode || null,
      state: profile?.state || null, // undefined at google
      description: profile?.description || null,
      imageUrl: google.photoUrl || profile?.imageUrl || null,
      mapUrl: google.googleMapsUri || profile?.mapUrl || null,
      rating: google.rating || profile?.rating || null,
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
