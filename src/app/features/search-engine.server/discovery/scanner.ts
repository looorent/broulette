import type { Coordinates } from "@features/coordinate";
import { findRestaurantsFromOverpass } from "./overpass";
import type { DiscoveredRestaurant, DiscoveredRestaurantIdentity, SearchDiscoveryConfig } from "./types";

export class RestaurantDiscoveryScanner {
  private iteration: number;
  private readonly identitiesToExclude: DiscoveredRestaurantIdentity[];

  constructor(
    private readonly nearBy: Coordinates,
    private readonly configuration: SearchDiscoveryConfig,
    private readonly signal: AbortSignal | undefined,
    initialIdentitiesToExclude: DiscoveredRestaurantIdentity[] = []
  ) {
    this.iteration = 0;
    this.identitiesToExclude = [...initialIdentitiesToExclude];
  }

  async nextRestaurants(): Promise<DiscoveredRestaurant[]> {
    if (this.isOver) {
      console.log("The discovery scanner has reached its limits. It is not going to ");
      return [];
    } else {
      this.iteration += 1;
      const range = this.currentRange;
      console.log(`Scanning range (iteration ${this.iteration}): ${range}m...`);
      const result = await discoverNearbyRestaurants(this.nearBy, this.currentRange, this.identitiesToExclude, this.configuration, this.signal);
      console.log(`Scanning range (iteration ${this.iteration}): ${range}m. Done.`);
      return result;
    }
  }

  get isOver(): boolean {
    return this.iteration >= this.configuration.maxDiscoveryIterations;
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

  private get currentRange(): number {
    return this.configuration.initialDiscoveryRangeMeters + this.iteration * this.configuration.discoveryRangeIncreaseMeters;
  }
}

async function discoverNearbyRestaurants(
  nearBy: Coordinates,
  rangeInMeters: number,
  identitiesToExclude: DiscoveredRestaurantIdentity[] = [],
  configuration: SearchDiscoveryConfig,
  signal: AbortSignal | undefined
): Promise<DiscoveredRestaurant[]> {
  // TODO implement other sources than overpass
  return await findRestaurantsFromOverpass(nearBy, rangeInMeters, identitiesToExclude, configuration, signal);
}
