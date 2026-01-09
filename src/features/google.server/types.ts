import { DEFAULT_FAILOVER, type FailoverConfiguration } from "@features/circuit-breaker.server";

import { DEFAULT_GOOGLE_PLACE_SIMILARITY_CONFIGURATION, type GoogleSimilarityConfiguration } from "./similarity";

export const GOOGLE_PLACE_SOURCE_NAME = "google_place";

export const DEFAULT_GOOGLE_PLACE_CONFIGURATION: GooglePlaceConfiguration = {
  enabled: false,
  baseUrl: "https://places.googleapis.com/v1",
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
  similarity: DEFAULT_GOOGLE_PLACE_SIMILARITY_CONFIGURATION,
  failover: DEFAULT_FAILOVER
}

export interface GooglePlaceConfiguration {
  enabled: boolean;
  baseUrl: string;
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
  failover: FailoverConfiguration;
}

export interface GoogleRestaurant {
  id: string;
  latitude: number;
  longitude: number;
  displayName: string | undefined | null;
  types: string[];
  primaryType: string | undefined | null;
  nationalPhoneNumber: string | undefined | null;
  internationalPhoneNumber: string | undefined | null;
  formattedAddress: string | undefined | null;
  shortFormattedAddress: string | undefined | null;
  countryCode: string | undefined | null;
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


export interface GooglePlace {
  id?: string;
  name?: string;
  displayName?: { text: string; languageCode?: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  addressComponents?: Array<{ longText: string; shortText: string; types: string[] }>;
  location?: { latitude: number; longitude: number };
  types?: string[];
  primaryType?: string;
  businessStatus?: string;
  googleMapsUri?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  regularOpeningHours?: {
    periods: Array<{
      open: { day: number; hour: number; minute: number };
      close?: { day: number; hour: number; minute: number };
    }>;
  };
  priceRange?: {
    startPrice?: { currencyCode: string; units: string; nanos: number };
    endPrice?: { currencyCode: string; units: string; nanos: number };
  };
  priceLevel?: string;
  photos?: Array<{ name: string; widthPx: number; heightPx: number; authorAttributions: any[] }>;
}
