export type OverpassRestaurantType = "way" | "node" | "relation";

// move to "interface"
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
}
