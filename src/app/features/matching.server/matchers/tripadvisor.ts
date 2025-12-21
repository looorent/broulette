import prisma from "@features/db.server/prisma";
import { hasTripAdvisorReachedQuota } from "@features/rate-limiting.server";
import { TRIPADVISOR_SOURCE_NAME, type TripAdvisorConfiguration } from "@features/tripadvisor.server";
import { thirtyDaysAgo } from "@features/utils/date";
import type { RestaurantAndProfiles, RestaurantMatchingConfiguration } from "../types";
import type { Matcher, Matching } from "./types";

export class TripAdvisorMatcher implements Matcher {
  readonly source = TRIPADVISOR_SOURCE_NAME;

  constructor(readonly configuration: TripAdvisorConfiguration) {}

  async matchAndEnrich(
    restaurant: RestaurantAndProfiles,
    matchingConfiguration: RestaurantMatchingConfiguration,
    signal?: AbortSignal | undefined
  ): Promise<Matching> {
    let enriched = restaurant;
    const alreadyAttemptedRecently = await prisma.restaurantMatchingAttempt.existsSince(thirtyDaysAgo(), restaurant.id, this.source);
    if (!alreadyAttemptedRecently) {
      enriched = await this.enrichWithTripAdvisor(restaurant, matchingConfiguration, signal);
    }
    return {
      success: enriched.matched,
      restaurant: enriched
    };
  }

  async hasReachedQuota(): Promise<boolean> {
    return await hasTripAdvisorReachedQuota(this.configuration.rateLimiting.maxNumberOfAttemptsPerMonth);
  }

  private async enrichWithTripAdvisor(
    restaurant: RestaurantAndProfiles,
    matchingConfiguration: RestaurantMatchingConfiguration,
    signal?: AbortSignal | undefined
  ): Promise<RestaurantAndProfiles> {
    return restaurant; // TODO
  }
}
