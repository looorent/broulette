import { DEFAULT_TAG_CONFIGURATION, type RestaurantTagConfiguration } from "@features/tag.server";

export const DEFAULT_MATCHING_CONFIGURATION: RestaurantMatchingConfiguration = {
  tags: DEFAULT_TAG_CONFIGURATION
};

export interface RestaurantMatchingConfiguration {
  tags: RestaurantTagConfiguration;
}
