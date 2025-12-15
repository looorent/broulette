import type { SearchDiscoveryConfig } from "./discovery/types";
import type { RestaurantMatchingConfig } from "./matching/types";

export interface SearchEngineConfiguration {
  discovery: SearchDiscoveryConfig;
  matching: RestaurantMatchingConfig;
  tags: {
    toExclude: string[];
  };
}
