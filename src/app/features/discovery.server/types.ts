import type { Coordinates } from "@features/coordinate";
import { DEFAULT_OVERPASS_CONFIGURATION, type OverpassConfiguration } from "@features/overpass.server";

export const DEFAULT_DISCOVERY_CONFIGURATION: DiscoveryConfiguration = {
  search: {
    discoveryRangeIncreaseMeters: 2_000,
    maxDiscoveryIterations: 3
  },

  engine: {
    overpass: DEFAULT_OVERPASS_CONFIGURATION
  }
};

export interface DiscoveryConfiguration {
  search: {
    discoveryRangeIncreaseMeters: number;
    maxDiscoveryIterations: number;
  };

  engine: {
    overpass: OverpassConfiguration;
  };
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
