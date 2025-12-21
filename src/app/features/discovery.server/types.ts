import type { RestaurantProfile } from "@persistence/client";

export const DEFAULT_DISCOVERY_CONFIGURATION: DiscoveryConfiguration = {
  rangeIncreaseMeters: 2_000,
  maxDiscoveryIterations: 3
};

export interface DiscoveryConfiguration {
  rangeIncreaseMeters: number;
  maxDiscoveryIterations: number;
}

export type DiscoveryRestaurantIdentity = Pick<RestaurantProfile, "source" | "externalType" | "externalId">;

export type DiscoveredRestaurantProfile = Omit<RestaurantProfile, "id" | "createdAt" | "updatedAt" | "version" | "restaurantId">;
