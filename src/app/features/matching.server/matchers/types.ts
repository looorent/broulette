import type { RestaurantWithIdentities } from "../types";

export interface Matching {
  success: boolean;
  restaurant: RestaurantWithIdentities;
  reason?: string | undefined;
}

export interface Matcher {
  source: string;
  matchAndEnrich(restaurant: RestaurantWithIdentities, signal?: AbortSignal | undefined): Promise<Matching>;
  hasReachedQuota(): Promise<boolean>;
}
