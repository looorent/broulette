import { DEFAULT_GOOGLE_PLACE_CONFIGURATION, type GooglePlaceConfiguration } from "@features/google.server";
import type { Prisma } from "@persistence/client";

export type RestaurantWithIdentities = Prisma.RestaurantGetPayload<{
  include: {
    identities: true;
  }
}>;

export const DEFAULT_TAG_CONFIGURATION: RestaurantTagConfiguration = {
  hiddenTags: [
    "restaurant",
    "establishment",
    "point_of_interest",
    "food",
  ],
  maxTags: 5,
  priorityTags: []
};

export const DEFAULT_MATCHING_CONFIGURATION: RestaurantMatchingConfiguration = {
  google: DEFAULT_GOOGLE_PLACE_CONFIGURATION,
  tags: DEFAULT_TAG_CONFIGURATION
};

export interface RestaurantTagConfiguration {
  hiddenTags: string[];
  maxTags: number;
  priorityTags: string[];
}

export interface RestaurantMatchingConfiguration {
  tags: RestaurantTagConfiguration;
  google: GooglePlaceConfiguration | undefined;
  // TODO add source of data (tripadvisor, etc)
}
