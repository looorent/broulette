import { getDistance } from "geolib";
import stringSimilarity from "string-similarity";

interface SimilarityResult {
  totalScore: number; // [0..1]
  nameScore: number; // [0..1]
  distanceScore: number; // [0..1]
  distanceMeters: number;
}

export const DEFAULT_GOOGLE_PLACE_SIMILARITY_CONFIGURATION: GoogleSimilarityConfiguration = {
  weight: {
    name: 0.4,
    location: 0.6
  },
  maxDistanceInMeters: 50
};

export interface GoogleSimilarityConfiguration {
  weight: {
    name: number;
    location: number;
  };
  maxDistanceInMeters: number;
}

interface ComparableRestaurant {
  displayName: string | undefined | null;
  latitude: number;
  longitude: number;
}

export function compareSimilarity(
  restaurant: ComparableRestaurant,
  other: ComparableRestaurant,
  configuration: GoogleSimilarityConfiguration = DEFAULT_GOOGLE_PLACE_SIMILARITY_CONFIGURATION
): SimilarityResult {
  const nameScore = stringSimilarity.compareTwoStrings(restaurant?.displayName || "", other?.displayName || "");

  let distanceInMeters: number;
  if (!restaurant.latitude || !other.latitude || !restaurant.longitude || !other.longitude) {
    distanceInMeters = 0;
  } else {
    distanceInMeters = getDistance(
      { latitude: restaurant.latitude, longitude: restaurant.longitude },
      { latitude: other.latitude, longitude: other.longitude }
    );
  }
  const distanceScore = Math.max(0, 1 - distanceInMeters / configuration.maxDistanceInMeters);
  const totalScore = (nameScore * configuration.weight.name) + (distanceScore * configuration.weight.location);

  return {
    totalScore: totalScore,
    nameScore: nameScore,
    distanceScore: distanceScore,
    distanceMeters: distanceInMeters
  };
}
