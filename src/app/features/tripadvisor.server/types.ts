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
    maxDistanceInMeters: 50
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
  webUrl: string | undefined;
}


interface AddressInfo {
  street1: string;
  city: string;
  state: string;
  country: string;
  postalcode: string;
  address_string: string;
}

interface RankingData {
  geo_location_id: string;
  ranking_string: string;
  geo_location_name: string;
  ranking_out_of: string;
  ranking: string;
}

interface ReviewRatingCount {
  "1": string;
  "2": string;
  "3": string;
  "4": string;
  "5": string;
}

/**
 * Detailed rating categories (Food, Service, Value, etc.).
 */
export interface SubRating {
  name: string;
  localized_name: string;
  rating_image_url: string;
  value: string;
}

/**
 * Generic category structure used for Cuisine, Category, etc.
 */
export interface CategoryInfo {
  name: string;
  localized_name: string;
}

/**
 * Demographics of travelers visiting the location.
 */
export interface TripType {
  name: string;
  localized_name: string;
  value: string;
}

/**
 * The main interface for the Restaurant/Location object.
 */
export interface TripAdvisorLocation {
  location_id: string;
  name: string;
  web_url: string;
  address_obj: AddressInfo;
  latitude: string;
  longitude: string;
  timezone: string;
  phone: string;
  website: string;
  write_review: string;
  ranking_data: RankingData;
  rating: string;
  rating_image_url: string;
  num_reviews: string;
  review_rating_count: ReviewRatingCount;
  /**
   * Subratings are indexed by stringified integers ("0", "1", etc.)
   */
  subratings: Record<string, SubRating>;
  photo_count: string;
  see_all_photos: string;
  price_level: string;
  features: string[]; // Assumed string array based on common API patterns, though empty in JSON
  cuisine: CategoryInfo[];
  category: CategoryInfo;
  subcategory: CategoryInfo[];
  neighborhood_info: any[]; // Kept loose as source data is empty
  trip_types: TripType[];
  awards: any[]; // Kept loose as source data is empty
}

export interface TripAdvisorLocationNearby {
  locationId: string;
  name: string;
  distance: number;
  bearing: string;
  address: AddressInfo;
}
