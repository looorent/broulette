import type { GoogleSimilarityConfiguration } from "@features/google.server";
import type { Prisma } from "@persistence/client";

export type RestaurantWithIdentities = Prisma.RestaurantGetPayload<{
  include: {
    identities: true;
  }
}>;

export interface RestaurantMatchingConfig {
  google: {
    enabled: boolean;
    apiKey: string;
    searchRadiusInMeters: number;
    maxNumberOfAttemptsPerMonth: number;
    retry: number;
    timeOutInMilliseconds: number;
    similarity: GoogleSimilarityConfiguration;
  }
}

export interface Matching {
  success: boolean;
  restaurant: RestaurantWithIdentities;
  reason?: string | undefined;
}

export interface Matcher {
  source: string;
  matchAndEnrich: (restaurant: RestaurantWithIdentities, configuration: RestaurantMatchingConfig) => Promise<Matching>;
}
