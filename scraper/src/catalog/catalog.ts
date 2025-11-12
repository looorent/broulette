import { randomUUID } from "node:crypto";
import { GoogleRestaurantSearchResult } from "../google/types";
import { OverpassResponse, OverpassRestaurant } from "../overpass/types";
import { reportRestaurantsMatchedWithGoogle, reportRestaurantsMatchedWithGoogleWithoutTheDetails, reportRestaurantsWithoutOverpassName } from "../report/printer";
import type { TripAdvisorSearchResult } from "../tripadvisor/types";

function daysBetween(date: Date, otherDate: Date): number {
  const msInDay = 24 * 60 * 60 * 1000;
  return Math.floor(Math.abs(otherDate.getTime() - date.getTime()) / msInDay);
}

export class Restaurant {
  constructor(
    readonly id: string,
    readonly overpassRestaurant: OverpassRestaurant | undefined,
    readonly google: GoogleRestaurantSearchResult | undefined,
    readonly tripAdvisor: TripAdvisorSearchResult | undefined
  ) {}

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
      this.google,
      this.tripAdvisor
    );
  }

  withGooglePlaceSearch(searchResult: GoogleRestaurantSearchResult): Restaurant {
    return new Restaurant(
      this.id,
      this.overpassRestaurant,
      searchResult.clone(),
      this.tripAdvisor
    );
  }

  withTripAdvisorLocationSearch(searchResult: TripAdvisorSearchResult): Restaurant {
    return new Restaurant(
      this.id,
      this.overpassRestaurant,
      this.google,
      searchResult?.clone()
    );
  }

  hasOverpassName(): boolean {
    return (this.overpassRestaurant?.name?.length || 0) > 0;
  }

  canBeSearched(): boolean {
    return this.hasOverpassName();
  }

  hasAlreadyBeenSearchedWithGoogle(): boolean {
    return this.google !== undefined && this.google !== null;
  }
  
  hasAlreadyBeenSearchedWithTripAdvisor(): boolean {
    return this.tripAdvisor !== undefined && this.tripAdvisor !== null;
  }

  hasBeenSearchedWithGoogleInTheLastMonth(now: Date) : boolean {
    return this.hasAlreadyBeenSearchedWithGoogle() && daysBetween(this.google!.searchedAt, now) < 30;
  }

  hasBeenSearchedWithTripAdvisorInTheLastMonth(now: Date): boolean {
    return this.hasAlreadyBeenSearchedWithTripAdvisor() && daysBetween(this.tripAdvisor!.searchedAt, now) < 30;
  }

  clone(): Restaurant {
    return new Restaurant(
      this.id,
      this.overpassRestaurant?.clone(),
      this.google?.clone(),
      this.tripAdvisor?.clone()
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

  mergeWithGooglePlaceSearch(restaurantId: string, searchResult: GoogleRestaurantSearchResult | undefined): Catalog {
    return this.mergeRestaurantWith(restaurantId, searchResult, (search, restaurant) => restaurant.withGooglePlaceSearch(search));
  }

  mergeWithTripAdvisorLocationSearch(restaurantId: string, searchResult: TripAdvisorSearchResult | undefined): Catalog {
    return this.mergeRestaurantWith(restaurantId, searchResult, (search, restaurant) => restaurant.withTripAdvisorLocationSearch(search));
  }

  printHighlights(): this {
    reportRestaurantsWithoutOverpassName(this);
    reportRestaurantsMatchedWithGoogle(this);
    reportRestaurantsMatchedWithGoogleWithoutTheDetails(this);
    return this;
  }

  asJson(): string {
    return JSON.stringify({
      version: this.version,
      overpass: this.overpassResponse,
      restaurants: this.restaurants?.toSorted((a, b) => a.compareTo(b))
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

  private mergeRestaurantWith<SR>(restaurantId: string, searchResult: SR | undefined, updateRestaurantFn: (searchResult: SR, restaurant: Restaurant) => Restaurant): Catalog {
    if (searchResult) {
      const index = this.restaurants?.findIndex(restaurant => restaurant.id === restaurantId);
      if (index >= 0) {
        const updatedRestaurants = [...this.restaurants];
        const restaurantToUpdate = this.restaurants?.[index];
        const updatedRestaurant = restaurantToUpdate ? updateRestaurantFn(searchResult, restaurantToUpdate) : undefined;
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
    } else {
      return this;
    }
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

function createRestaurantFromOverpass(overpassRestaurant: OverpassRestaurant): Restaurant {
  return new Restaurant(randomUUID(), overpassRestaurant, undefined, undefined);
}

