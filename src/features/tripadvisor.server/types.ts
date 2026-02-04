import { DEFAULT_FAILOVER, type FailoverConfiguration } from "@features/circuit-breaker.server";

import type { TripAdvisorSimilarityConfiguration } from "./similarity";

export const TRIPADVISOR_SOURCE_NAME = "tripadvisor";

export const TRIPADVISOR_PHOTO_SIZES = ["thumbnail", "small", "medium", "large", "original"] as const;
export type TripAdvisorPhotoSize = typeof TRIPADVISOR_PHOTO_SIZES[number];
export const TRIPADVISOR_DEFAULT_PHOTO_SIZE: TripAdvisorPhotoSize = "large";

export const DEFAULT_TRIPADVISOR_CONFIGURATION: TripAdvisorConfiguration = {
  instanceUrl: "https://api.content.tripadvisor.com/api/v1",
  enabled: false,
  apiKey: "",
  rateLimiting: {
    maxNumberOfAttemptsPerMonth: 200
  },
  search: {
    radiusInMeters: 50
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
  timezone: string;
  address: AddressInfo | undefined;
  website: string | undefined;
  phone: string | undefined;
  rankingData: RankingData | undefined;
  rating: number | undefined;
  numberOfReviews: number;
  numberOfReviewsPerRating: {[rating: number]: number};
  photoCount: number;
  priceLevel: string | undefined;
  cuisine: LocalizedName[];
  category: LocalizedName | undefined;
  subcategories: LocalizedName[];
  hours: LocationHours | undefined;
  openingHours: string | undefined;
  features: string[];
  tripTypes: TripType[];
  imageUrl: string | undefined;
  awards: Award[];
}

export interface TripAdvisorLocationNearby {
  locationId: string;
  name: string;
  distanceInMeters: number;
  bearing: string;
  address: AddressInfo | undefined;
}

export interface TripAdvisorPhoto {
  id: number;
  blessed: boolean;
  caption: string;
  source: LocalizedName | undefined;
  images: TripAdvisorImageSet;
}

export interface Award {
  type: string;
  year: number;
  categories: string[];
  displayName: string;
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

export interface RankingData {
  geoLocationId: string | undefined;
  geoLocationName: string | undefined;
  ranking: number;
  rankingString: string | undefined;
  rankingOutOf: number;
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
  weekdayText?: string[];
}

export interface TripType {
  name: string;
  localizedName: string;
  value: number | undefined;
}

export interface TripAdvisorImageVariant {
  height: number;
  width: number;
  url: string;
}

export interface TripAdvisorImageSet {
  thumbnail?: TripAdvisorImageVariant | undefined;
  small?: TripAdvisorImageVariant | undefined;
  medium?: TripAdvisorImageVariant | undefined;
  large?: TripAdvisorImageVariant | undefined;
  original?: TripAdvisorImageVariant | undefined;
}

export interface TripAdvisorRawLocationDetails {
  location_id: string;
  name: string;
  description?: string;
  latitude?: string | number;
  longitude?: string | number;
  timezone: string;
  web_url?: string;
  website?: string;
  phone?: string;
  address_obj?: TripAdvisorRawAddress;
  ranking_data?: TripAdvisorRawRankingData;
  rating?: string | number;
  num_reviews?: string;
  review_rating_count?: Record<string, string>;
  photo_count?: string | number;
  price_level?: string;
  cuisine?: TripAdvisorRawLocalizedName[];
  category?: TripAdvisorRawLocalizedName;
  subcategory?: TripAdvisorRawLocalizedName[];
  hours?: TripAdvisorRawHours;
  features?: string[];
  trip_types?: TripAdvisorRawTripType[];
  awards?: TripAdvisorRawAward[];
}

export interface TripAdvisorRawAddress {
  street1?: string;
  street2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalcode?: string;
  address_string?: string;
}

export interface TripAdvisorRawRankingData {
  geo_location_id?: string;
  geo_location_name?: string;
  ranking_string?: string;
  ranking_out_of?: string;
  ranking?: string;
}

export interface TripAdvisorRawLocalizedName {
  name: string;
  localized_name: string;
}

export interface TripAdvisorRawTripType {
  name: string;
  localized_name: string;
  value?: string | number;
}

export interface TripAdvisorRawHours {
  periods?: TripAdvisorRawPeriod[];
  weekday_text?: string[];
}

export interface TripAdvisorRawPeriod {
  open?: { day: number | string; time?: string };
  close?: { day: number | string; time?: string };
}

export interface TripAdvisorRawAward {
  award_type: string;
  year: string | number;
  categories: string[];
  display_name: string;
}

export interface TripAdvisorRawLocationNearby {
  location_id: string;
  name: string;
  distance?: string | number;
  bearing: string;
  address_obj?: TripAdvisorRawAddress;
}

export interface TripAdvisorRawNearbyResponse {
  data: TripAdvisorRawLocationNearby[];
}

export interface TripAdvisorRawPhoto {
  id: number;
  is_blessed: boolean;
  caption: string;
  source?: TripAdvisorRawLocalizedName;
  images?: TripAdvisorRawImageSet;
}

export interface TripAdvisorRawImageSet {
  thumbnail?: TripAdvisorRawImageVariant;
  small?: TripAdvisorRawImageVariant;
  medium?: TripAdvisorRawImageVariant;
  large?: TripAdvisorRawImageVariant;
  original?: TripAdvisorRawImageVariant;
}

export interface TripAdvisorRawImageVariant {
  height: number;
  width: number;
  url: string;
}

export interface TripAdvisorRawPhotoResponse {
  data: TripAdvisorRawPhoto[];
}

export interface TripAdvisorRawErrorResponse {
  error?: {
    message: string;
    type: string;
    code: number
  };
}
