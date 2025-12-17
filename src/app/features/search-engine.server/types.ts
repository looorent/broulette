import { DEFAULT_DISCOVERY_CONFIGURATION } from "@features/discovery.server";

export interface SearchEngineRange {
  rangeInMeters: number;
  timeoutInMs: number;
}

export const DEFAULT_SEARCH_ENGINE_CONFIGURATION: SearchEngineConfiguration = {
  discovery: DEFAULT_DISCOVERY_CONFIGURATION,
  matching: DEFAULT_MATCHING_CONFIGURATION,
  range: {
    close: {
      rangeInMeters: 1_000,
      timeoutInMs: 5_000
    },
    midRange: {
      rangeInMeters: 5_000,
      timeoutInMs: 10_000
    },
    far: {
      rangeInMeters: 20_000,
      timeoutInMs: 30_000
    }
  }
}


export interface SearchEngineConfiguration {
  discovery: SearchDiscoveryConfig;
  matching: RestaurantMatchingConfig;
  range: {
    close: SearchEngineRange;
    midRange: SearchEngineRange;
    far: SearchEngineRange;
  };
}
