import type { Coordinates } from "@features/coordinate";
import type { RestaurantIdentity } from "@persistence/browser";

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

const SOURCES_FOR_DISCOVERY = new Set(["osm"]);
export function findSourceIn(identities: RestaurantIdentity[] = []): string | undefined {
  const preferredIdentity = identities.find(id => !SOURCES_FOR_DISCOVERY.has(id.source));
  const selectedIdentity = preferredIdentity ?? identities[0];
  return selectedIdentity?.source;
}
