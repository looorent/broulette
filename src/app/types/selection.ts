import type { Coordinates } from "./location";

export class Selection {
  constructor(readonly id: string,
              readonly searchId: string,
              readonly restaurant: {
                name: string;
                description: string;
                rating: string;
                priceRange: string;
                address: string;
                phoneNumber: string;
                tagNames: string[];
                imageUrl: string;
                location: Coordinates;
                source: string;
              }
  ) {}

  toUrl(): string {
    return `/searches/${this.searchId}/selections/${this.id}`;
  }
}

export function createDefaultSelection(searchId: string): Selection {
  return new Selection(
    crypto.randomUUID(),
    searchId,
    {
      name: "Taco Loco",
      address: "55 Space Blvd",
      description: "Authentic street tacos served from a truck that looks like a spaceship.",
      imageUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80",
      rating: "4.4",
      phoneNumber: "+32 499 01 02 03",
      priceRange: "$$$",
      tagNames: [
        "Mexican",
        "Tacos"
      ],
      location: {
        latitude: 50.9658273,
        longitude: 4.8359792
      },
      source: "tripadvisor"
    }
  );
}
