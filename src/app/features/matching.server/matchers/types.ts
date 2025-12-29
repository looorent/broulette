import type { ExtendedPrismaClient } from "@features/db.server";

import type { RestaurantAndProfiles, RestaurantMatchingConfiguration } from "../types";

export interface Matching {
  restaurant: RestaurantAndProfiles;
  matched: boolean;
  error?: string | undefined;
}

export interface Matcher {
  source: string;
  matchAndEnrich(
    restaurant: RestaurantAndProfiles,
    prisma: ExtendedPrismaClient,
    matchingConfiguration: RestaurantMatchingConfiguration,
    language: string,
    signal?: AbortSignal | undefined
  ): Promise<Matching>;
  hasReachedQuota(prisma: ExtendedPrismaClient): Promise<boolean>;
}
