import type { Coordinates } from "@features/coordinate";

export const DEFAULT_DISCOVERY_CONFIGURATION: DiscoveryConfiguration = {
  rangeIncreaseMeters: 2_000,
  maxDiscoveryIterations: 3
};

export interface DiscoveryConfiguration {
  rangeIncreaseMeters: number;
  maxDiscoveryIterations: number;
}

export type DiscoverySource = "osm";

export interface DiscoveredRestaurantIdentity {
  source: string;
  type: string;
  externalId: string;
}

export interface DiscoveredRestaurant {
  name: string;
  coordinates: Coordinates;
  identity: DiscoveredRestaurantIdentity;
  countryCode: string | undefined;
  addressState: string | undefined;
  formattedAddress: string | undefined;
  website: string | undefined;
  mapUrl: string;
  description: string | undefined;
  phoneNumber: string | undefined;
  internationalPhoneNumber: string | undefined;
  tags: string[];
  openingHours: string | undefined;
}
