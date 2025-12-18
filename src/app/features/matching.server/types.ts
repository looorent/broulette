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
  tags: DEFAULT_TAG_CONFIGURATION
};

export interface RestaurantTagConfiguration {
  hiddenTags: string[];
  maxTags: number;
  priorityTags: string[];
}

export interface RestaurantMatchingConfiguration {
  tags: RestaurantTagConfiguration;
}
