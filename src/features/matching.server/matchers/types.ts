import type { MatchingRepository, RestaurantAndProfiles, RestaurantRepository } from "@persistence";

import type { RestaurantMatchingConfiguration } from "../types";

export interface Matching {
  restaurant: RestaurantAndProfiles;
  matched: boolean;
  error?: string | undefined;
}

export interface Matcher {
  source: string;
  matchAndEnrich(
    restaurant: RestaurantAndProfiles,
    restaurantRepository: RestaurantRepository,
    matchingRepository: MatchingRepository,
    matchingConfiguration: RestaurantMatchingConfiguration,
    language: string,
    signal?: AbortSignal | undefined
  ): Promise<Matching>;
  hasReachedQuota(matchingRepository: MatchingRepository): Promise<boolean>;
}
