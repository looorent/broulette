import type { Coordinates } from "@features/coordinate";

export interface SearchDiscoveryConfig {
  overpass: {
    instanceUrl: string;
    timeoutInSeconds: number;
  },
  initialDiscoveryRangeMeters: number;
  discoveryRangeIncreaseMeters: number;
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
