
import { executeInPriorityOrder } from "@features/balancer.server";
import type { Coordinates } from "@features/coordinate";
import type { OverpassConfiguration } from "@features/overpass.server";
import { logger } from "@features/utils/logger";
import type { RestaurantProfile } from "@persistence";

import { keepWithinArea, readCachedDiscovery, toCacheableArea, writeCachedDiscovery, type CachedDiscovery, type DiscoveryArea, type DiscoveryCacheConfiguration } from "./cache";
import { loadBalancer } from "./providers";
import { type DiscoveredRestaurantProfile, type DiscoveryConfiguration, type DiscoveryRestaurantIdentity } from "./types";

export class RestaurantDiscoveryScanner {
  private iteration: number;
  private readonly identitiesToExclude: DiscoveryRestaurantIdentity[];

  constructor(
    private readonly nearBy: Coordinates,
    private readonly initialRangeInMeters: number,
    private readonly timeoutInMs: number,
    private readonly configuration: DiscoveryConfiguration,
    private readonly overpass: OverpassConfiguration | undefined,
    initialIdentitiesToExclude: DiscoveryRestaurantIdentity[] = [],
    private readonly fallbacks: DiscoveryFallbacks = {}
  ) {
    this.iteration = 0;
    this.identitiesToExclude = [...initialIdentitiesToExclude];
  }

  async nextRestaurants(signal: AbortSignal | undefined): Promise<DiscoveredRestaurantProfile[]> {
    if (this.isOver) {
      logger.trace("[Discovery] Max iterations reached. Stopping scan.");
      return [];
    } else {
      this.iteration += 1;
      const range = this.initialRangeInMeters + (this.iteration - 1) * this.configuration.rangeIncreaseMeters;
      logger.trace("[Discovery] Iteration %d/%d: Scanning range %dm...", this.iteration, this.configuration.maxDiscoveryIterations, range);

      try {
        const result = await this.discoverNearbyRestaurants(range, signal);
        logger.trace("[Discovery] Iteration %d: Found %d candidates.", this.iteration, result.length);
        return result;
      } catch (error) {
        logger.error("[Discovery] Iteration %d: Scan failed. %s", this.iteration, error);
        throw error;
      }
    }
  }

  addIdentityToExclude(identity: RestaurantProfile): this {
    if (identity) {
      const exists = this.identitiesToExclude.some(id => id.source === identity.source && id.externalId === identity.externalId && id.externalType === identity.externalType);
      if (!exists) {
        this.identitiesToExclude.push(identity);
      }
    }
    return this;
  }

  get isOver(): boolean {
    return this.iteration >= this.configuration.maxDiscoveryIterations;
  }

  get timeoutInSeconds(): number {
    return this.timeoutInMs / 1_000;
  }

  private async discoverNearbyRestaurants(rangeInMeters: number, signal: AbortSignal | undefined): Promise<DiscoveredRestaurantProfile[]> {
    const requestedArea: DiscoveryArea = { center: this.nearBy, rangeInMeters };
    const cacheableArea = toCacheableArea(requestedArea);
    const { cache, findKnownRestaurants } = this.fallbacks;

    let cachedDiscovery: Promise<CachedDiscovery | undefined> | undefined;
    const readCache = () => cachedDiscovery ??= cache ? readCachedDiscovery(cache, cacheableArea) : Promise.resolve(undefined);

    const restaurants = await executeInPriorityOrder<DiscoveredRestaurantProfile[]>([
      {
        name: "discovery cache (fresh)",
        execute: async () => {
          const cached = await readCache();
          return cached?.fresh ? cached.restaurants : undefined;
        }
      },
      {
        name: "overpass",
        execute: async () => {
          const discovered = await loadBalancer(this.overpass).execute(cacheableArea.center, cacheableArea.rangeInMeters, this.timeoutInSeconds, [], signal);
          if (cache) {
            await writeCachedDiscovery(cache, cacheableArea, discovered);
          }
          return discovered;
        }
      },
      {
        name: "discovery cache (stale)",
        execute: async () => (await readCache())?.restaurants
      },
      {
        name: "known restaurants",
        execute: async () => {
          const known = await findKnownRestaurants?.(cacheableArea);
          return known?.length ? known : undefined;
        }
      }
    ]);

    return this.withoutExcludedIdentities(keepWithinArea(restaurants, requestedArea));
  }

  private withoutExcludedIdentities(restaurants: DiscoveredRestaurantProfile[]): DiscoveredRestaurantProfile[] {
    return restaurants.filter(restaurant => !this.identitiesToExclude.some(identity =>
      identity.source === restaurant.source && identity.externalType === restaurant.externalType && identity.externalId === restaurant.externalId
    ));
  }
}

export interface DiscoveryFallbacks {
  cache?: DiscoveryCacheConfiguration;
  /** Restaurants already known from previous searches, used when no live source can answer. */
  findKnownRestaurants?: (area: DiscoveryArea) => Promise<DiscoveredRestaurantProfile[]>;
}
