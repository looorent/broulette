import type { Coordinates } from "@features/coordinate";
import { getDistance } from "geolib";
import stringSimilarity from "string-similarity";

// TODO check if this is the same implementation than google

interface SimilarityResult {
  totalScore: number; // [0..1]
  nameScore: number; // [0..1]
  distanceScore: number; // [0..1]
  distanceMeters: number;
}

export interface TripAdvisorSimilarityConfiguration {
  weight: {
    name: number;
    location: number;
  };
  maxDistanceInMeters: number;
}

interface ComparableRestaurant {
  displayName: string | undefined | null;
  location: Coordinates | undefined | null;
}

export function compareSimilarity(
  restaurant: ComparableRestaurant,
  other: ComparableRestaurant,
  configuration: TripAdvisorSimilarityConfiguration
): SimilarityResult {
  const nameScore = stringSimilarity.compareTwoStrings(restaurant?.displayName || "", other?.displayName || "");

  let distanceInMeters: number;
  if (!restaurant.location || !other.location) {
    distanceInMeters = 0;
  } else {
    distanceInMeters = getDistance(
      { latitude: restaurant.location.latitude, longitude: restaurant.location.longitude },
      { latitude: other.location.latitude, longitude: other.location.longitude }
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
