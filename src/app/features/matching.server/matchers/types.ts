import type { RestaurantAndProfiles, RestaurantMatchingConfiguration } from "../types";

export interface Matching {
  success: boolean;
  restaurant: RestaurantAndProfiles;
  reason?: string | undefined;
}

export interface Matcher {
  source: string;
  matchAndEnrich(restaurant: RestaurantAndProfiles, matchingConfiguration: RestaurantMatchingConfiguration, signal?: AbortSignal | undefined): Promise<Matching>;
  hasReachedQuota(): Promise<boolean>;
}
