import type { Coordinates } from "@features/coordinate";
import type { RestaurantProfile } from "@persistence/client";

import { LOAD_BALANCER } from "./providers";
import { type DiscoveredRestaurantProfile, type DiscoveryConfiguration, type DiscoveryRestaurantIdentity } from "./types";

export class RestaurantDiscoveryScanner {
  private iteration: number;
  private readonly identitiesToExclude: DiscoveryRestaurantIdentity[];

  constructor(
    private readonly nearBy: Coordinates,
    private readonly initialRangeInMeters: number,
    private readonly timeoutInMs: number,
    private readonly configuration: DiscoveryConfiguration,
    initialIdentitiesToExclude: DiscoveryRestaurantIdentity[] = []
  ) {
    this.iteration = 0;
    this.identitiesToExclude = [...initialIdentitiesToExclude];
  }

  async nextRestaurants(signal: AbortSignal | undefined): Promise<DiscoveredRestaurantProfile[]> {
    if (this.isOver) {
      console.log("The discovery scanner has reached its limits. It is not going to ");
      return [];
    } else {
      this.iteration += 1;
      const range = this.initialRangeInMeters + this.iteration * this.configuration.rangeIncreaseMeters;
      console.log(`Scanning range (iteration ${this.iteration}): ${range}m...`);
      const result = await this.discoverNearbyRestaurants(range, signal);
      console.log(`Scanning range (iteration ${this.iteration}): ${range}m. Done.`);
      return result;
    }
  }

  get isOver(): boolean {
    return this.iteration >= this.configuration.maxDiscoveryIterations;
  }

  get timeoutInSeconds(): number {
    return this.timeoutInMs / 1_000;
  }

  addIdentityToExclude(identity: RestaurantProfile): this {
    if (identity) {
      const exists = this.identitiesToExclude.some(id => id.source === identity.source && id.externalId === identity.source && id.externalType === identity.externalType);
      if (!exists) {
        this.identitiesToExclude.push(identity);
      }
    }
    return this;
  }

  private discoverNearbyRestaurants(rangeInMeters: number, signal: AbortSignal | undefined): Promise<DiscoveredRestaurantProfile[]> {
    return LOAD_BALANCER.execute(this.nearBy, rangeInMeters, this.timeoutInMs, this.identitiesToExclude, signal);
  }
}
