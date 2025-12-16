import type { SearchDiscoveryConfig } from "./discovery/types";
import type { RestaurantMatchingConfig } from "./matching/types";

export interface RestaurantTagConfiguration {
  hiddenTags: string[];
  maxTags: number;
  priorityTags: string[];
}

export interface SearchEngineConfiguration {
  discovery: SearchDiscoveryConfig;
  matching: RestaurantMatchingConfig;
}
