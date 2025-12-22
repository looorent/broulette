import type { TripAdvisorSimilarityConfiguration } from "./similarity";

export const TRIPADVISOR_SOURCE_NAME = "tripadvisor";

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
  }
}

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

// TODO parser and converter to OpeningHours
export interface TimeInterval {
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
  value: number;
}

export interface TripAdvisorLocationNearby {
  locationId: string;
  name: string;
  distanceInMeters: number;
  bearing: string;
  address: AddressInfo | undefined;
}
