import { DEFAULT_DISCOVERY_CONFIGURATION, type DiscoveryConfiguration } from "@features/discovery.server";
import { DEFAULT_MATCHING_CONFIGURATION, type RestaurantMatchingConfiguration } from "@features/matching.server";

export interface SearchEngineRange {
  rangeInMeters: number;
  timeoutInMs: number;
}

export const DEFAULT_SEARCH_ENGINE_CONFIGURATION: SearchEngineConfiguration = {
  discovery: DEFAULT_DISCOVERY_CONFIGURATION,
  matching: DEFAULT_MATCHING_CONFIGURATION,
  range: {
    close: {
      rangeInMeters: 1_500,
      timeoutInMs: 5_000
    },
    midRange: {
      rangeInMeters: 15_000,
      timeoutInMs: 10_000
    },
    far: {
      rangeInMeters: 40_000,
      timeoutInMs: 30_000
    }
  }
}


export interface SearchEngineConfiguration {
  discovery: DiscoveryConfiguration;
  matching: RestaurantMatchingConfiguration;
  range: {
    close: SearchEngineRange;
    midRange: SearchEngineRange;
    far: SearchEngineRange;
  };
}
