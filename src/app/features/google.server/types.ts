import type { Coordinates } from "@features/coordinate";

export interface GooglePlaceConfiguration {
  apiKey: string;
  failover: {
    retry: number;
    timeoutInSeconds: number;
  },
  photo: {
    maxWidthInPx: number
    maxHeightInPx: number
  }
}

export interface GoogleRestaurant {
  id: string;
  location: Coordinates | undefined | null;
  displayName: string | undefined | null;
  types: string[];
  primaryType: string | undefined | null;
  nationalPhoneNumber: string | undefined | null;
  internationalPhoneNumber: string | undefined | null;
  formattedAddress: string | undefined | null;
  countryCode: string | undefined | null;
  shortFormattedAddress: string | undefined | null;
  rating: number | undefined | null;
  userRatingCount: number | undefined | null;
  googleMapsUri: string | undefined | null;
  websiteUri: string | undefined | null;
  openingHours: string | undefined;
  operational: boolean | undefined;
  priceLevel: number | undefined | null;
  photoIds: string[];
  photoUrl: string | undefined;
}
