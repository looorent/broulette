import type { FailoverConfiguration } from "@features/circuit-breaker.server/types";
import type { Coordinates } from "@features/coordinate";

export type OverpassLocationType = "way" | "node" | "relation";

export interface OverpassRestaurant {
  id: number;
  type: OverpassLocationType;
  name: string;
  location: Coordinates;
  tags: { [tagName: string]: string };
  phoneNumber: string | undefined;
  amenity: string | undefined;
  cuisine: string | undefined;
  countryCode: string | undefined;
  street: string | undefined;
  city: string | undefined;
  addressState: string | undefined;
  postCode: string | undefined;
  formattedAddress: string | undefined;
  website: string | undefined;
  openingHours: string | undefined;
  description: string | undefined;
}

export interface OverpassResponse {
  generator: string;
  version: number;
  copyright: string;
  timestampInUtc: string;
  durationInMs: number;
  restaurants: OverpassRestaurant[];
}

export interface OverpassConfiguration {
  instanceUrls: string[];
  failover: FailoverConfiguration;
}
