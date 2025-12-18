import { DEFAULT_TAG_CONFIGURATION, type RestaurantTagConfiguration } from "@features/tag.server";
import type { Prisma } from "@persistence/client";

export type RestaurantWithIdentities = Prisma.RestaurantGetPayload<{
  include: {
    identities: true;
  }
}>;

export const DEFAULT_MATCHING_CONFIGURATION: RestaurantMatchingConfiguration = {
  tags: DEFAULT_TAG_CONFIGURATION
};

export interface RestaurantMatchingConfiguration {
  tags: RestaurantTagConfiguration;
}
