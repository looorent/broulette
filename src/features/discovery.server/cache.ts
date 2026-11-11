import { computeDistanceInMeters, type Coordinates } from "@features/coordinate";
import { logger } from "@features/utils/logger";

import type { DiscoveredRestaurantProfile } from "./types";

const CACHE_KEY_PREFIX = "discovery:v1";
const GRID_STEP_IN_DEGREES = 0.005;
// Covers the half-diagonal of a grid cell (~393m at the equator), so the snapped area always contains the requested one.
const GRID_MARGIN_IN_METERS = 400;
const KV_MINIMUM_TTL_SECONDS = 60;

export interface DiscoveryCacheConfiguration {
  keyStore: KVNamespace;
  freshForSeconds: number;
  keptForSeconds: number;
}

export interface DiscoveryArea {
  center: Coordinates;
  rangeInMeters: number;
}

export interface CachedDiscovery {
  restaurants: DiscoveredRestaurantProfile[];
  fresh: boolean;
}

interface StoredDiscovery {
  storedAt: number;
  restaurants: DiscoveredRestaurantProfile[];
}

/**
 * Returns the grid-aligned area that contains the requested one, so that nearby searches share the same cache entry.
 * Results fetched for it must be narrowed back with {@link keepWithinArea}.
 */
export function toCacheableArea(area: DiscoveryArea): DiscoveryArea {
  return {
    center: {
      latitude: snapToGrid(area.center.latitude),
      longitude: snapToGrid(area.center.longitude)
    },
    rangeInMeters: area.rangeInMeters + GRID_MARGIN_IN_METERS
  };
}

export function keepWithinArea(restaurants: DiscoveredRestaurantProfile[], area: DiscoveryArea): DiscoveredRestaurantProfile[] {
  return restaurants.filter(restaurant => computeDistanceInMeters(area.center, restaurant) <= area.rangeInMeters);
}

/** Never throws: an unreadable or corrupted entry is reported as a cache miss. */
export async function readCachedDiscovery(configuration: DiscoveryCacheConfiguration, area: DiscoveryArea, now: number = Date.now()): Promise<CachedDiscovery | undefined> {
  try {
    const stored = await configuration.keyStore.get<StoredDiscovery>(cacheKeyOf(area), "json");
    if (stored && Array.isArray(stored.restaurants)) {
      return {
        restaurants: stored.restaurants,
        fresh: now - stored.storedAt < configuration.freshForSeconds * 1_000
      };
    }
  } catch (error) {
    logger.warn("[Discovery] Unable to read discovery cache: %s", error);
  }
  return undefined;
}

/** Never throws: a failed write only costs a future cache miss. */
export async function writeCachedDiscovery(configuration: DiscoveryCacheConfiguration, area: DiscoveryArea, restaurants: DiscoveredRestaurantProfile[], now: number = Date.now()): Promise<void> {
  try {
    const stored: StoredDiscovery = { storedAt: now, restaurants };
    await configuration.keyStore.put(cacheKeyOf(area), JSON.stringify(stored), {
      expirationTtl: Math.max(configuration.keptForSeconds, KV_MINIMUM_TTL_SECONDS)
    });
  } catch (error) {
    logger.warn("[Discovery] Unable to write discovery cache: %s", error);
  }
}

function cacheKeyOf(area: DiscoveryArea): string {
  return `${CACHE_KEY_PREFIX}:${area.center.latitude.toFixed(3)}:${area.center.longitude.toFixed(3)}:${area.rangeInMeters}`;
}

function snapToGrid(value: number): number {
  return Number((Math.round(value / GRID_STEP_IN_DEGREES) * GRID_STEP_IN_DEGREES).toFixed(3));
}
