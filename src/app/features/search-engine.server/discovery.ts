import type { Coordinates } from "@features/coordinate";
import { isOpenAtTarget } from "./opening-hours";
import { fetchAllRestaurantsNearbyWithRetry } from "@features/overpass.server";
import { OVERPASS_SOURCE_NAME } from "@config";

export type DiscoverySource = "osm";

export interface DiscoveredRestaurantAddress {
  countryCode: string;
  state: string | undefined;
}

export interface DiscoveredRestaurantIdentity {
  source: string;
  type: string;
  externalId: string;
}

export class DiscoveredRestaurant {
  constructor(
    readonly name: string,
    readonly coordinates: Coordinates,
    readonly identity: DiscoveredRestaurantIdentity,
    readonly address: DiscoveredRestaurantAddress | undefined,
    readonly phoneNumber: string | undefined,
    readonly tags: string[],
    readonly openingHours: string | undefined,
  ) {}

  isOpen(instant: Date): boolean | null {
    return isOpenAtTarget(
      this.openingHours,
      this.coordinates.latitude,
      this.coordinates.longitude,
      this.address?.countryCode,
      this.address?.state,
      instant
    );
  }
}

export interface SearchDiscoveryConfig {
  initialDiscoveryRangeMeters: number;
  discoveryRangeIncreaseMeters: number;
  maxDiscoveryIterations: number;
}

export class RestaurantDiscoveryScanner {
  private iteration: number;
  private readonly identitiesToExclude: DiscoveredRestaurantIdentity[];

  constructor(
    private readonly nearBy: Coordinates,
    private readonly configuration: SearchDiscoveryConfig,
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
      const result = await discoverNearbyRestaurants(this.nearBy, this.currentRange, this.identitiesToExclude);
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
  identitiesToExclude: DiscoveredRestaurantIdentity[] = []
): Promise<DiscoveredRestaurant[]> {
  // TODO implement other sources than overpass
  return await findRestaurantsFromOverpass(nearBy, rangeInMeters, identitiesToExclude);
}

async function findRestaurantsFromOverpass(
  nearBy: Coordinates,
  rangeInMeters: number,
  identitiesToExclude: DiscoveredRestaurantIdentity[]
): Promise<DiscoveredRestaurant[]> {
  const idsToExclude = identitiesToExclude
    .filter(Boolean)
    .filter(id => id.source === OVERPASS_SOURCE_NAME)
    .map(id => ({ osmId: id.externalId, osmType: id.type }));

  const response = await fetchAllRestaurantsNearbyWithRetry(nearBy.latitude, nearBy.longitude, rangeInMeters, idsToExclude);

  return (response?.restaurants || [])
    .map(restaurant => new DiscoveredRestaurant(
      restaurant.name,
      {
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
      },
      {
        source: OVERPASS_SOURCE_NAME,
        type: restaurant.type,
        externalId: restaurant.id.toString()
      },
      restaurant.addressCountry && restaurant.addressCountry?.length > 0 ? {
        countryCode: restaurant.addressCountry,
        state: restaurant.addressState
      } : undefined,
      restaurant.phone,
      restaurant.cuisine && restaurant.cuisine?.length > 0 ? restaurant.cuisine?.split(";") || [] : [],
      restaurant.openingHours
    )
  );
}

function filterTags(tags: string[] | undefined): string[] {
  return tags || []; // TODO
}
