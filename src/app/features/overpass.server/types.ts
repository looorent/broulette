export const OVERPASS_SOURCE_NAME = "osm";
export type OverpassLocationType = "way" | "node" | "relation";

export const DEFAULT_OVERPASS_CONFIGURATION: OverpassConfiguration = {
  enabled: true,
  instanceUrls: [
    "https://overpass-api.de/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://overpass.private.coffee/api/interpreter"
  ]
};

export interface OverpassRestaurant {
  id: number;
  type: OverpassLocationType;
  name: string;
  latitude: number;
  longitude: number;
  phoneNumber: string | undefined;
  amenity: string | undefined;
  cuisine: string[];
  countryCode: string | undefined;
  vegan: string | undefined;
  vegetarian: string | undefined;
  street: string | undefined;
  city: string | undefined;
  addressState: string | undefined;
  postCode: string | undefined;
  formattedAddress: string | undefined;
  website: string | undefined;
  openingHours: string | undefined;
  description: string | undefined;
  imageUrl: string | undefined;
  openStreetMapUrl: string;
  operational: boolean;
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
  enabled: boolean;
  instanceUrls: string[];
}
