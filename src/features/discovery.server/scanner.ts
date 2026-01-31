
import type { Coordinates } from "@features/coordinate";
import type { OverpassConfiguration } from "@features/overpass.server";
import { logger } from "@features/utils/logger";
import type { RestaurantProfile } from "@persistence";

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
    initialIdentitiesToExclude: DiscoveryRestaurantIdentity[] = []
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

  private discoverNearbyRestaurants(rangeInMeters: number, signal: AbortSignal | undefined): Promise<DiscoveredRestaurantProfile[]> {
    return loadBalancer(this.overpass).execute(this.nearBy, rangeInMeters, this.timeoutInSeconds, this.identitiesToExclude, signal);
  }
}
