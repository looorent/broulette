import type { Coordinates } from "@features/coordinate";
import { DEFAULT_GOOGLE_PLACE_SIMILARITY_CONFIGURATION, type GoogleSimilarityConfiguration } from "./similarity";

export const GOOGLE_PLACE_SOURCE_NAME = "google_place";

export const DEFAULT_GOOGLE_PLACE_CONFIGURATION: GooglePlaceConfiguration = {
  enabled: false,
  apiKey: "",
  rateLimiting: {
    maxNumberOfAttemptsPerMonth: 200
  },
  search: {
    radiusInMeters: 50
  },
  photo: {
    maxWidthInPx: 1024,
    maxHeightInPx: 512
  },
  similarity: DEFAULT_GOOGLE_PLACE_SIMILARITY_CONFIGURATION
}

export interface GooglePlaceConfiguration {
  enabled: boolean;
  apiKey: string;
  photo: {
    maxWidthInPx: number
    maxHeightInPx: number
  };
  rateLimiting: {
    maxNumberOfAttemptsPerMonth: number;
  };
  search: {
    radiusInMeters: number;
  };
  similarity: GoogleSimilarityConfiguration;
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
  priceLabel: string | undefined | null;
  photoIds: string[];
  photoUrl: string | undefined;
}
