import { LoadBalancer } from "@features/balancer.server";
import type { Coordinates } from "@features/coordinate";
import { registeredProviders } from "./providers";
import type { DiscoveredRestaurant, DiscoveredRestaurantIdentity, DiscoveryConfiguration } from "./types";

const LOAD_BALANCER = new LoadBalancer(registeredProviders);
export class RestaurantDiscoveryScanner {
  private iteration: number;
  private readonly identitiesToExclude: DiscoveredRestaurantIdentity[];

  constructor(
    private readonly nearBy: Coordinates,
    private readonly initialRangeInMeters: number,
    private readonly timeoutInMs: number,
    private readonly configuration: DiscoveryConfiguration,
    initialIdentitiesToExclude: DiscoveredRestaurantIdentity[] = []
  ) {
    this.iteration = 0;
    this.identitiesToExclude = [...initialIdentitiesToExclude];
  }

  async nextRestaurants(signal: AbortSignal | undefined): Promise<DiscoveredRestaurant[]> {
    if (this.isOver) {
      console.log("The discovery scanner has reached its limits. It is not going to ");
      return [];
    } else {
      this.iteration += 1;
      const range = this.initialRangeInMeters + this.iteration * this.configuration.search.rangeIncreaseMeters;
      console.log(`Scanning range (iteration ${this.iteration}): ${range}m...`);
      const result = await this.discoverNearbyRestaurants(range, signal);
      console.log(`Scanning range (iteration ${this.iteration}): ${range}m. Done.`);
      return result;
    }
  }

  get isOver(): boolean {
    return this.iteration >= this.configuration.search.maxDiscoveryIterations;
  }

  get timeoutInSeconds(): number {
    return this.timeoutInMs / 1_000;
  }

  addIdentityToExclude(identity: DiscoveredRestaurantIdentity): this {
    if (identity) {
      const exists = this.identitiesToExclude.some(id => id.source === identity.source && id.externalId === identity.source);
      if (!exists) {
        this.identitiesToExclude.push(identity);
      }
    }
    return this;
  }

  private discoverNearbyRestaurants(rangeInMeters: number, signal: AbortSignal | undefined): Promise<DiscoveredRestaurant[]> {
    return LOAD_BALANCER.execute(this.nearBy, rangeInMeters, this.timeoutInMs, this.identitiesToExclude, signal);
  }
}

