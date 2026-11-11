import { DEFAULT_FAILOVER, type FailoverConfiguration } from "@features/circuit-breaker.server";

import type { TripAdvisorSimilarityConfiguration } from "./similarity";

export const TRIPADVISOR_SOURCE_NAME = "tripadvisor";

export const TRIPADVISOR_PHOTO_SIZES = ["thumbnail", "small", "medium", "large", "original"] as const;
export type TripAdvisorPhotoSize = typeof TRIPADVISOR_PHOTO_SIZES[number];
export const TRIPADVISOR_DEFAULT_PHOTO_SIZE: TripAdvisorPhotoSize = "large";

export const DEFAULT_TRIPADVISOR_CONFIGURATION: TripAdvisorConfiguration = {
  instanceUrl: "https://terra.tripadvisor.com/api",
  enabled: false,
  apiKey: "",
  rateLimiting: {
    maxNumberOfAttemptsPerMonth: 200
  },
  search: {
    radiusInMeters: 50,
    maxResults: 5
  },
  similarity: {
    weight: {
      name: 0.4,
      location: 0.6
    },
    maxDistanceInMeters: 50,
    minScoreThreshold: 0.6
  },
  photo: TRIPADVISOR_DEFAULT_PHOTO_SIZE,
  failover: DEFAULT_FAILOVER
};

export interface TripAdvisorConfiguration {
  instanceUrl: string;
  enabled: boolean;
  apiKey: string;
  rateLimiting: {
    maxNumberOfAttemptsPerMonth: number;
  };
  search: {
    radiusInMeters: number;
    /** Every location returned by a nearby search is billed, so keep it small. */
    maxResults: number;
  };
  similarity: TripAdvisorSimilarityConfiguration;
  photo: TripAdvisorPhotoSize;
  failover: FailoverConfiguration;
}

export interface TripAdvisorLocation {
  id: string;
  name: string;
  description: string | undefined;
  tripAdvisorUrl: string | undefined;
  latitude: number | undefined;
  longitude: number | undefined;
  address: AddressInfo | undefined;
  website: string | undefined;
  phone: string | undefined;
  rating: number | undefined;
  numberOfReviews: number;
  priceLevel: string | undefined;
  cuisine: LocalizedName[];
  openingHours: string | undefined;
  photoId: string | undefined;
}

export interface TripAdvisorLocationNearby {
  locationId: string;
  name: string;
  distanceInMeters: number;
  bearing: string;
  address: AddressInfo | undefined;
}

export interface AddressInfo {
  street1: string | undefined;
  street2: string | undefined;
  city: string | undefined;
  state: string | undefined;
  country: string | undefined;
  postalcode: string | undefined;
  addressString: string | undefined;
}

export interface LocalizedName {
  name: string;
  localizedName: string;
}

interface TimeInterval {
  day: number;
  time: string;
}

export interface OperatingPeriod {
  open: TimeInterval | undefined;
  close?: TimeInterval | undefined;
}

export interface LocationHours {
  periods: OperatingPeriod[];
}

// Terra API payloads (https://docs.terra.tripadvisor.com), restricted to the fields in use.

export interface TerraLocation {
  id: number;
  names?: TerraTranslation[];
  descriptions?: TerraTranslation[];
  addresses?: TerraAddress[];
  coordinates?: { latitude: number; longitude: number };
  phone_numbers?: { type: string; value: string }[];
  urls?: {
    official?: string;
    tripadvisor?: { main?: string };
  };
  traveler_ratings?: {
    overall?: { rating?: number; count?: number };
  };
  price_level?: string;
  categories?: { id: string; display_name?: string }[];
  opening_hours?: {
    periods?: TerraPeriod[];
  };
}

export interface TerraTranslation {
  language: string;
  value: string;
  primary?: boolean;
}

export interface TerraAddress {
  street_address?: string;
  street_address2?: string;
  city?: string;
  state?: string;
  country_code?: string;
  postal_code?: string;
  formatted?: string;
}

export interface TerraPeriod {
  day_of_week?: string;
  opens?: string;
  closes?: string;
}

export interface TerraNearbyLocation {
  location: TerraLocation;
  distance_kilometers?: number;
  bearing?: number;
  photo?: TerraPhoto;
}

export interface TerraNearbyResponse {
  data?: TerraNearbyLocation[];
}

export interface TerraPhoto {
  photo?: { key?: string };
}

export interface TerraProblemDetail {
  status?: number;
  title?: string;
  detail?: string;
  message?: string;
}
