export type OverpassRestaurantType = "way" | "node" | "relation";

export class OverpassRestaurant {
  constructor(
    readonly id: number,
    readonly type: OverpassRestaurantType,
    readonly name: string,
    readonly latitude: number,
    readonly longitude: number,
    readonly tags: { [tagName: string]: string },
    readonly amenity: string
  ) {}

  clone(): OverpassRestaurant {
    return new OverpassRestaurant(
      this.id,
      this.type,
      this.name,
      this.latitude,
      this.longitude,
      structuredClone(this.tags),
      this.amenity
    );
  }

  // TODO Lorent is this the best option to find a Google place? For TripAdvisor, it is not.
  createSearchableText(): string {
    return [
      this.name,
      this.addressStreet,
      this.addressCity,
      this.addressPostcode,
      this.phone,
      "Restaurant"
    ]
      .filter(Boolean)
      .join(" ");
  }

  get addressStreet(): string | undefined {
    return this.tags["addr:street"];
  }

  get addressCity(): string | undefined {
    return this.tags["addr:city"];
  }

  get addressPostcode(): string | undefined {
    return this.tags["addr:postcode"];
  }

  get addressStreetWithNumber(): string | undefined {
    const address = [this.addressStreet, this.addressHouseNumber]
      .filter(Boolean)
      .filter((text) => text!.length > 0)
      .join(" ");
    return address.length > 0 ? address : undefined;
  }

  get addressCountry(): string | undefined {
    return this.tags["addr:country"];
  }

  get addressHouseNumber(): string | undefined {
    return this.tags["addr:housenumber"];
  }

  get cuisine(): string | undefined {
    return this.tags["cuisine"];
  }

  get phone(): string | undefined {
    return this.tags["phone"];
  }

  get website(): string | undefined {
    return this.tags["website"];
  }

  get openingHours(): string | undefined {
    return this.tags["opening_hours"];
  }

  get email(): string | undefined {
    return this.tags["email"];
  }

  get wheelchair(): string | undefined {
    return this.tags["wheelchair"];
  }

  get smoking(): string | undefined {
    return this.tags["smoking"];
  }

  get outdoorSeating(): string | undefined {
    return this.tags["outdoor_seating"];
  }

  get takeaway(): string | undefined {
    return this.tags["takeaway"];
  }

  get delivery(): string | undefined {
    return this.tags["delivery"];
  }

  get description(): string | undefined {
    return this.tags["description"];
  }

  asHash(): any {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      latitude: this.latitude,
      longitude: this.longitude,
      tags: this.tags,
      amenity: this.amenity
    };
  }
}

export class OverpassResponse {
  constructor(
    readonly generator: string,
    readonly version: number,
    readonly copyright: string,
    readonly timestampInUtc: string,
    readonly durationInMs: number,
    readonly restaurants: OverpassRestaurant[],
    readonly raw: any
  ) {}

  clone(): OverpassResponse {
    return new OverpassResponse(
      this.generator,
      this.version,
      this.copyright,
      this.timestampInUtc,
      this.durationInMs,
      this.restaurants.map((restaurant) => restaurant.clone()),
      structuredClone(this.raw)
    );
  }

  asHash(): any {
    return {
      generator: this.generator,
      version: this.version,
      copyright: this.copyright,
      timestampInUtc: this.timestampInUtc,
      durationInMs: this.durationInMs,
      restaurants: this.restaurants?.map((restaurant) => restaurant?.asHash()),
      raw: this.raw
    };
  }
}
