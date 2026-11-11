import type { RestaurantProfile } from "@persistence";

export const DEFAULT_DISCOVERY_CONFIGURATION: DiscoveryConfiguration = {
  rangeIncreaseMeters: 2_000,
  maxDiscoveryIterations: 3,
  cacheFreshForSeconds: 7 * 24 * 60 * 60,
  cacheKeptForSeconds: 90 * 24 * 60 * 60
};

export interface DiscoveryConfiguration {
  rangeIncreaseMeters: number;
  maxDiscoveryIterations: number;
  cacheFreshForSeconds: number;
  cacheKeptForSeconds: number;
}

export type DiscoveryRestaurantIdentity = Pick<RestaurantProfile, "source" | "externalType" | "externalId">;

export type DiscoveredRestaurantProfile = Omit<RestaurantProfile, "id" | "createdAt" | "updatedAt" | "version" | "restaurantId">;
