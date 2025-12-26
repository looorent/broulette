import stringSimilarity from "string-similarity";

import type { TripAdvisorLocationNearby } from "./types";

interface SimilarityResult {
  totalScore: number; // [0..1]
  nameScore: number; // [0..1]
  distanceScore: number; // [0..1]
  distanceMeters: number;
}

export const DEFAULT_TRIPADVISOR_SIMILARITY_CONFIGURATION: TripAdvisorSimilarityConfiguration = {
  weight: {
    name: 0.5,
    location: 0.5
  },
  maxDistanceInMeters: 100,
  minScoreThreshold: 0.6
};

export interface TripAdvisorSimilarityConfiguration {
  weight: {
    name: number;
    location: number;
  };
  maxDistanceInMeters: number;
  minScoreThreshold: number;
}

export function findBestTripAdvisorMatch(
  targetName: string,
  candidates: TripAdvisorLocationNearby[],
  configuration: TripAdvisorSimilarityConfiguration = DEFAULT_TRIPADVISOR_SIMILARITY_CONFIGURATION
): TripAdvisorLocationNearby | undefined {
  if (!candidates.length || !targetName) {
    return undefined;
  } else {
    const scoredCandidates = candidates.map(candidate => {
      return {
        candidate,
        result: compareSimilarity(targetName, candidate, configuration)
      };
    });
    scoredCandidates.sort((a, b) => b.result.totalScore - a.result.totalScore);
    const best = scoredCandidates[0];

    if (best && best.result.totalScore >= configuration.minScoreThreshold) {
      return best.candidate;
    } else {
      return undefined;
    }
  }
}

export function compareSimilarity(
  targetName: string,
  candidate: TripAdvisorLocationNearby,
  configuration: TripAdvisorSimilarityConfiguration
): SimilarityResult {
  const nameScore = stringSimilarity.compareTwoStrings(
    targetName || "",
    candidate.name || ""
  );
  const distanceInMeters = candidate.distanceInMeters ?? Infinity;
  const distanceScore = Math.max(0, 1 - distanceInMeters / configuration.maxDistanceInMeters);
  const totalScore = (nameScore * configuration.weight.name) + (distanceScore * configuration.weight.location);

  return {
    totalScore,
    nameScore,
    distanceScore,
    distanceMeters: distanceInMeters
  };
}
