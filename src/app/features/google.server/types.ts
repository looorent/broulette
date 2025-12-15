import type { Coordinates } from "@features/coordinate";
import { type protos } from "@googlemaps/places";

export interface GoogleRestaurant {
  id: string;
  name: string | undefined | null;
  displayName: string | undefined | null;
  types: string[];
  primaryType: string | undefined | null;
  nationalPhoneNumber: string | undefined | null;
  internationalPhoneNumber: string | undefined | null;
  formattedAddress: string | undefined | null;
  countryCode: string | undefined | null;
  shortFormattedAddress: string | undefined | null;
  location: Coordinates | undefined | null;
  rating: number | undefined | null;
  userRatingCount: number | undefined | null;
  googleMapsUri: string | undefined | null;
  websiteUri: string | undefined | null;
  openingHours: string | undefined;
  operational: boolean | undefined;
  priceLevel: number | undefined | null;
}
