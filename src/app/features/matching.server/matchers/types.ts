import { Prisma } from "@persistence/client";
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
    matchingConfiguration: RestaurantMatchingConfiguration,
    language: string,
    signal?: AbortSignal | undefined
  ): Promise<Matching>;
  hasReachedQuota(): Promise<boolean>;
}

export function toDecimal(value: number | undefined | null): Prisma.Decimal | undefined {
  if (value === null || value === undefined) {
    return undefined;
  } else {
    return new Prisma.Decimal(value);
  }
}
