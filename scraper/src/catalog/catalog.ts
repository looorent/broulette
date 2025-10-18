import { randomUUID } from "node:crypto";
import { OverpassResponse, OverpassRestaurant } from "../overpass/types";
import { GoogleRestaurant } from "../google/types";
import { reportRestaurantsMatchedWithGoogle, reportRestaurantsWithoutOverpassName } from "../report/printer";
import { CmpStr } from "cmpstr";

function daysBetween(date: Date, otherDate: Date): number {
  const msInDay = 24 * 60 * 60 * 1000;
  return Math.floor(Math.abs(otherDate.getTime() - date.getTime()) / msInDay);
}


export class Restaurant {
  constructor(
    readonly id: string,
    readonly overpassRestaurant: OverpassRestaurant | undefined,
    readonly googleRestaurant: GoogleRestaurant | undefined,
    readonly googleRestaurantsFoundNearby: GoogleRestaurant[] | undefined,
    readonly searchedOnGoogleAt: Date | undefined // undefined means "never searched"
  ) { }

  compareTo(other: Restaurant): number {
    return this.id?.localeCompare(other?.id);
  }

  hasOverpassId(id: number): boolean {
    return id > 0 && this.overpassRestaurant?.id === id
  }

  withOverpassRestaurant(overpassRestaurant: OverpassRestaurant | undefined): Restaurant {
    return new Restaurant(
      this.id,
      overpassRestaurant || this.overpassRestaurant || undefined,
      this.googleRestaurant,
      this.googleRestaurantsFoundNearby,
      this.searchedOnGoogleAt
    );
  }

  withGoogleRestaurant(googleRestaurants: GoogleRestaurant[]): Restaurant {
    const bestRestaurant = findTheClosestRestaurant(googleRestaurants, this.overpassRestaurant!.name!);
    return new Restaurant(
      this.id,
      this.overpassRestaurant,
      bestRestaurant,
      googleRestaurants,
      bestRestaurant ? new Date() : undefined
    );
  }

  hasGoogleRestaurant(): boolean {
    return this.googleRestaurant !== null && this.googleRestaurant !== undefined;
  }

  hasOverpassName(): boolean {
    return (this.overpassRestaurant?.name?.length || 0) > 0;
  }

  hasAlreadyBeenSearchedWithGoogle(): boolean {
    return this.searchedOnGoogleAt !== undefined && this.searchedOnGoogleAt !== null;
  }

  hasBeenSearchedWithGoogleInTheLastMonth(now: Date) : boolean {
    return this.hasAlreadyBeenSearchedWithGoogle() && daysBetween(this.searchedOnGoogleAt!, now) < 30;
  }

  clone(): Restaurant {
    return new Restaurant(
      this.id,
      this.overpassRestaurant?.clone(),
      this.googleRestaurant?.clone(),
      this.googleRestaurantsFoundNearby?.filter(Boolean)?.map(restaurant => restaurant?.clone()),
      this.searchedOnGoogleAt
    );
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
    return new Catalog(this.version + 1, this.overpassResponse?.clone(), this.restaurants?.filter(Boolean)?.map(restaurant => restaurant.clone()));
  }

  mergeWithOverpass(overpassResponse: OverpassResponse | undefined): Catalog {
    if (overpassResponse) {
      return new Catalog(
        this.version,
        overpassResponse?.clone(),
        completeCatalogWithOverpassRestaurants(this.restaurants, overpassResponse.restaurants)
      );
    } else {
      return this;
    }
  }

  mergeWithGooglePlace(restaurantId: string, googleRestaurants: GoogleRestaurant[]): Catalog {
    const index = this.restaurants?.findIndex(restaurant => restaurant.id === restaurantId);
    if (index >= 0) {
      const updatedRestaurants = [...this.restaurants];
      const updatedRestaurant = this.restaurants?.[index]?.withGoogleRestaurant(googleRestaurants);
      if (updatedRestaurant) {
        updatedRestaurants.splice(index, 1, updatedRestaurant);
      }
      return new Catalog(
        this.version,
        this.overpassResponse,
        updatedRestaurants
      );
    } else {
      return this;
    }
  }

  printHighlights(): this {
    reportRestaurantsWithoutOverpassName(this);
    reportRestaurantsMatchedWithGoogle(this);
    return this;
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

  clone(): Catalog {
    return new Catalog(
      this.version,
      this.overpassResponse?.clone(),
      this.restaurants?.filter(Boolean)?.map(restaurant => restaurant.clone())
    )
  }
}

function completeCatalogWithOverpassRestaurants(existingRestaurants: Restaurant[], overpassRestaurants: OverpassRestaurant[]): Restaurant[] {
  const restaurants = existingRestaurants?.filter(Boolean)?.map(restaurant => restaurant.clone()) || [];
  const missingOverpassRestaurants = overpassRestaurants?.filter(overpassRestaurant => !restaurants.some(restaurant => restaurant.hasOverpassId(overpassRestaurant.id))) || [];
  return [
    ...restaurants.map(restaurant => restaurant.withOverpassRestaurant(overpassRestaurants.filter(Boolean).find(overpassRestaurant => restaurant.hasOverpassId(overpassRestaurant.id)) || undefined)),
    ...missingOverpassRestaurants.map(missingOverpassRestaurant => createRestaurantFromOverpass(missingOverpassRestaurant))
  ];
}


const COMPARATOR = CmpStr.create().setFlags("i").setMetric("jaroWinkler");

function findTheClosestRestaurant(restaurants: GoogleRestaurant[], name: string): GoogleRestaurant | undefined {
  if (!restaurants || restaurants.length === 0) {
    return undefined;
  } else {
    const scored = restaurants.map(restaurant => ({
      restaurant: restaurant,
      score: COMPARATOR.compare(restaurant.name, name)
    }));

    if (scored.length === 0) {
      return undefined;
    } else {
      return scored.sort((a, b) => b.score - a.score)[0]?.restaurant;
    }
  }
}

function createRestaurantFromOverpass(overpassRestaurant: OverpassRestaurant): Restaurant {
  return new Restaurant(randomUUID(), overpassRestaurant, undefined, undefined, undefined);
}

