import type { GoogleSimilarityConfiguration } from "@features/google.server";
import type { Prisma } from "@persistence/client";
import type { RestaurantTagConfiguration } from "../types";

export type RestaurantWithIdentities = Prisma.RestaurantGetPayload<{
  include: {
    identities: true;
  }
}>;

export interface RestaurantMatchingConfig {
  tags: RestaurantTagConfiguration;
  google: {
    enabled: boolean;
    apiKey: string;
    rateLimiting: {
      maxNumberOfAttemptsPerMonth: number;
    };
    search: {
      radiusInMeters: number;
    };
    failover: {
      retry: number;
      timeoutInSeconds: number;
    };
    photo: {
      maxWidthInPx: number;
      maxHeightInPx: number;
    }
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
