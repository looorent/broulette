import { randomUUID } from "node:crypto";
import type { OverpassResponse, OverpassRestaurant } from "../overpass/types";

export class Restaurant {
  constructor(readonly id: string,
    readonly overpassRestaurant: OverpassRestaurant | undefined) { }

  compareTo(other: Restaurant): number {
    return this.id?.localeCompare(other?.id);
  }

  hasOverpassId(id: number): boolean {
    return id > 0 && this.overpassRestaurant?.id === id
  }

  withOverpassRestaurant(overpassRestaurant: OverpassRestaurant | undefined): Restaurant {
    return new Restaurant(this.id, overpassRestaurant || this.overpassRestaurant || undefined);
  }
}

export class Catalog {
  static empty(): Catalog {
    return new Catalog(0, undefined, []);
  }

  constructor(readonly version: number,
    readonly overpassResponse: OverpassResponse | undefined,
    readonly restaurants: Restaurant[]
  ) { }

  increaseVersion(): Catalog {
    return new Catalog(this.version + 1, structuredClone(this.overpassResponse), structuredClone(this.restaurants));
  }

  mergeWithOverpass(overpassResponse: OverpassResponse | undefined): Catalog {
    if (overpassResponse) {

      return new Catalog(
        this.version,
        structuredClone(overpassResponse),
        completeCatalogWithOverpassRestaurants(this.restaurants, overpassResponse.restaurants)
      );
    } else {
      return this;
    }
  }

  asJson(): string {
    return JSON.stringify({
      version: this.version,
      overpass: this.overpassResponse,
      restaurants: this.restaurants?.sort((a, b) => a.compareTo(b))
    }, null, 2);
  }

  get numberOfRestaurants(): number {
    return this.restaurants?.length || 0;
  }
}

function completeCatalogWithOverpassRestaurants(existingRestaurants: Restaurant[], overpassRestaurants: OverpassRestaurant[]): Restaurant[] {
  const restaurants = structuredClone(existingRestaurants || []);
  const missingOverpassRestaurants = overpassRestaurants?.filter(overpassRestaurant => !restaurants.some(restaurant => restaurant.hasOverpassId(overpassRestaurant.id))) || [];
  return [
    ...restaurants.map(restaurant => restaurant.withOverpassRestaurant(overpassRestaurants.filter(Boolean).find(overpassRestaurant => restaurant.hasOverpassId(overpassRestaurant.id)) || undefined)),
    ...missingOverpassRestaurants.map(missingOverpassRestaurant => new Restaurant(randomUUID(), missingOverpassRestaurant))
  ];
}