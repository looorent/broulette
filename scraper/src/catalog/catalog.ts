import { randomUUID } from "node:crypto";
import { OverpassResponse, OverpassRestaurant } from "../overpass/types";
import { GoogleRestaurant } from "../google/types";

export class Restaurant {
  constructor(
    readonly id: string,
    readonly overpassRestaurant: OverpassRestaurant | undefined,
    readonly googleRestaurant: GoogleRestaurant | undefined,
    readonly googleRestaurantsFoundNearby: GoogleRestaurant[] | undefined) { }

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
      this.googleRestaurantsFoundNearby
    );
  }

  withGoogleRestaurant(googleRestaurants: GoogleRestaurant[]): Restaurant {
    const bestRestaurant = findTheClosestRestaurant(googleRestaurants, this.overpassRestaurant!.name!, this.overpassRestaurant!.latitude, this.overpassRestaurant!.longitude);
    return new Restaurant(
      this.id,
      this.overpassRestaurant,
      bestRestaurant,
      googleRestaurants
    );
  }

  hasGoogleRestaurant(): boolean {
    return this.googleRestaurant !== null && this.googleRestaurant !== undefined;
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
    ...missingOverpassRestaurants.map(missingOverpassRestaurant => new Restaurant(randomUUID(), missingOverpassRestaurant, undefined, undefined))
  ];
}

function findTheClosestRestaurant(restaurants: GoogleRestaurant[], name: string, latitude: number, longitude: number): GoogleRestaurant | undefined {
    if (!restaurants || restaurants.length === 0) {
      return undefined
    } else {
      const lowerName = name.toLowerCase();
      const matchingRestaurants = restaurants.filter(restaurant => restaurant.name.toLowerCase().includes(lowerName));

      if (matchingRestaurants.length === 0) {
        return undefined;
      } else {
        // Find the closest among matches
        let closest: GoogleRestaurant | undefined = undefined;
        let minDistance = Number.POSITIVE_INFINITY;

        for (const restaurant of matchingRestaurants) {
            const lat = restaurant.location?.latitude;
            const lon = restaurant.location?.longitude;

            if (lat != null && lon != null) {
              const distance = haversineDistance(latitude, longitude, lat, lon);
                if (distance < minDistance) {
                  minDistance = distance;
                  closest = restaurant;
              }
            };
        }
        return closest;
      };
    }
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}