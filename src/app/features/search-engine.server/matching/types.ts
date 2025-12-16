import type { GooglePlaceConfiguration } from "@features/google.server";
import type { Prisma } from "@persistence/client";
import type { RestaurantTagConfiguration } from "../types";

export type RestaurantWithIdentities = Prisma.RestaurantGetPayload<{
  include: {
    identities: true;
  }
}>;

export interface RestaurantMatchingConfig {
  tags: RestaurantTagConfiguration;
  google: GooglePlaceConfiguration | undefined;
  // TODO add source of data (tripadvisor, etc)
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
