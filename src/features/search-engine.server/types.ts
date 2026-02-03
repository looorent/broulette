import { DEFAULT_DISCOVERY_CONFIGURATION, type DiscoveryConfiguration } from "@features/discovery.server";
import type { GooglePlaceConfiguration } from "@features/google.server";
import { DEFAULT_MATCHING_CONFIGURATION, type RestaurantMatchingConfiguration } from "@features/matching.server";
import type { OverpassConfiguration } from "@features/overpass.server";
import type { TripAdvisorConfiguration } from "@features/tripadvisor.server";
import type { CandidateRepository, MatchingRepository, RestaurantRepository, SearchCandidate, SearchRepository } from "@persistence";

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
      rangeInMeters: 12_000,
      timeoutInMs: 10_000
    },
    far: {
      rangeInMeters: 30_000,
      timeoutInMs: 25_000
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

export interface SearchContext {
  config: SearchEngineConfiguration;
  repositories: {
    search: SearchRepository;
    candidate: CandidateRepository;
    restaurant: RestaurantRepository;
    matching: MatchingRepository;
  };
  services: {
    overpass?: OverpassConfiguration;
    google?: GooglePlaceConfiguration;
    tripAdvisor?: TripAdvisorConfiguration;
  };
  signal?: AbortSignal;
}

export type SearchStreamEvent =
  | { type: "searching"; message: string }
  | { type: "exhausted"; message: string }
  | { type: "batch-discovered"; count: number; message: string }
  | { type: "checking-restaurants"; restaurantNames: string[] }
  | { type: "looking-for-fallbacks"; message: string }
  | { type: "result"; candidate: SearchCandidate }
  | { type: "redirect"; url: string };
