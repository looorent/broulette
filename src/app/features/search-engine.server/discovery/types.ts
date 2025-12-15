export interface SearchDiscoveryConfig {
  initialDiscoveryRangeMeters: number;
  discoveryRangeIncreaseMeters: number;
  maxDiscoveryIterations: number;
}

export type DiscoverySource = "osm";

export interface DiscoveredRestaurantAddress {
  countryCode: string;
  state: string | undefined;
}

export interface DiscoveredRestaurantIdentity {
  source: string;
  type: string;
  externalId: string;
}
