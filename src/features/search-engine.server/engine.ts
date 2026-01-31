import { RestaurantDiscoveryScanner, type DiscoveredRestaurantProfile } from "@features/discovery.server";
import { DEFAULT_GOOGLE_PLACE_CONFIGURATION, type GooglePlaceConfiguration } from "@features/google.server";
import { enrichRestaurant } from "@features/matching.server";
import { DEFAULT_OVERPASS_CONFIGURATION, type OverpassConfiguration } from "@features/overpass.server";
import { DEFAULT_TRIPADVISOR_CONFIGURATION, type TripAdvisorConfiguration } from "@features/tripadvisor.server";
import { logger } from "@features/utils/logger";
import { type CandidateRepository, type DistanceRange, type MatchingRepository, type RestaurantProfile, type RestaurantRepository, type Search, type SearchCandidate, type SearchRepository } from "@persistence";

import { SearchNotFoundError } from "./error";
import { randomize } from "./randomizer";
import { DEFAULT_SEARCH_ENGINE_CONFIGURATION, type SearchEngineConfiguration, type SearchEngineRange, type SearchStreamEvent } from "./types";
import { validateRestaurant } from "./validator";

const MESSAGES = [
  "Reticulating flavor splines!",
  "Hamsters are deciding.",
  "Spinning foodie fortune!",
  "Magic 8-ball says: Eat!",
  "Shuffling deliciousness.",
  "Locating yum.",
  "Calibrating hunger.",
];

export async function* searchCandidate(
  searchId: string,
  locale: string,
  searchRepository: SearchRepository,
  candidateRepository: CandidateRepository,
  restaurantRepository: RestaurantRepository,
  matchingRepository: MatchingRepository,
  configuration: SearchEngineConfiguration = DEFAULT_SEARCH_ENGINE_CONFIGURATION,
  overpass: OverpassConfiguration | undefined = DEFAULT_OVERPASS_CONFIGURATION,
  google: GooglePlaceConfiguration | undefined = DEFAULT_GOOGLE_PLACE_CONFIGURATION,
  tripAdvisor: TripAdvisorConfiguration | undefined = DEFAULT_TRIPADVISOR_CONFIGURATION,
  signal?: AbortSignal
): AsyncGenerator<SearchStreamEvent, void, unknown> {
  logger.log("[SearchEngine] searchCandidate: Starting search for searchId='%s'", searchId);

  yield { type: "searching", message: MESSAGES[Math.floor(Math.random() * MESSAGES.length)] };

  const search = await findSearchOrThrow(searchId, searchRepository);

  if (search.exhausted) {
    yield { type: "exhausted", message: "We've seen it all. Let's find a fallback." };
    logger.log("[SearchEngine] Search '%s' is already exhausted. Returning fallback candidate.", searchId);
    const candidate = await findLatestCandidateOf(search.id, searchRepository, candidateRepository) || await createDefaultCandidateWithoutRestaurant(search.id, searchRepository, candidateRepository);
    yield { type: "result", candidate };
  } else {
    const scanner = createDiscoveryScanner(search, configuration, overpass);
    const startingOrder = computeNextCandidateOrder(search.candidates);
    logger.log("[SearchEngine] Initializing discovery for searchId='%s'. Starting order: %d", searchId, startingOrder);

    const generator = findNextValidCandidateStream(search, scanner, configuration, startingOrder, locale, searchRepository, restaurantRepository, matchingRepository, candidateRepository, google, tripAdvisor, signal);

    let finalCandidate: SearchCandidate | undefined;
    for await (const event of generator) {
      if (event.type === "result") {
        finalCandidate = event.candidate;
      }
      yield event;
    }

    if (finalCandidate) {
      await markSearchAsExhaustedIfNecessary(search.id, finalCandidate, searchRepository);
    }
  }
}

async function* simulateFastChecking(
  restaurants: DiscoveredRestaurantProfile[],
  maxToShow: number = 10
): AsyncGenerator<SearchStreamEvent, void, unknown> {
  const fakeRestaurantsToShow = restaurants.slice(0, Math.min(restaurants.length, maxToShow))
    .map(restaurant => restaurant.name!)
    .filter(Boolean) || [];
  if (fakeRestaurantsToShow.length > 0) {
    yield { type: "checking-restaurants", restaurantNames: fakeRestaurantsToShow };
  }
}

async function* findNextValidCandidateStream(
  search: Search,
  scanner: RestaurantDiscoveryScanner,
  config: SearchEngineConfiguration,
  currentOrder: number,
  locale: string,
  searchRepository: SearchRepository,
  restaurantRepository: RestaurantRepository,
  matchingRepository: MatchingRepository,
  candidateRepository: CandidateRepository,
  google: GooglePlaceConfiguration | undefined,
  tripAdvisor: TripAdvisorConfiguration | undefined,
  signal?: AbortSignal
): AsyncGenerator<SearchStreamEvent, void, unknown> {
  let candidate: SearchCandidate | undefined = undefined;
  let orderTracker = currentOrder;

  while (shouldContinueToExploreMoreRestaurants(candidate, scanner) && !signal?.aborted) {
    const restaurants = await scanner.nextRestaurants(signal);

    if (restaurants.length > 0) {
      const randomized = await randomize(restaurants);
      logger.log("[SearchEngine] Processing batch of %d discovered restaurants...", randomized.length);
      yield { type: "batch-discovered", count: randomized.length, message: randomized.length + " options detected! Digging in..." };

      yield* simulateFastChecking(randomized, 10);

      for (const restaurant of randomized) {
        if (candidate?.status !== "Returned") {
          if (signal?.aborted) {
            break;
          } else {
            yield { type: "checking-restaurants", restaurantNames: [restaurant.name || "?!?"]};
            const processed = await processRestaurant(restaurant, search, orderTracker++, config, restaurantRepository, matchingRepository, candidateRepository, google, tripAdvisor, locale, scanner);
            if (processed) {
              candidate = processed;
              logger.log("[SearchEngine] Candidate found: %s (Status: %s)", candidate.id, candidate.status);
            }
          }
        } else {
          break;
        }
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  if (candidate) {
    logger.log("[SearchEngine] Candidate found after scanning: '%s' in status '%s'.", candidate.id, candidate.status);
    yield { type: "result", candidate };
  } else {
    yield { type: "looking-for-fallbacks", message: "No winners yet. Checking the rejects..." };
    logger.log("[SearchEngine] No valid candidate found after scanning. Trying to find a fallback...");
    const fallbackCandidate = await candidateRepository.findBestRejectedCandidateThatCouldServeAsFallback(search.id);
    if (fallbackCandidate) {
      logger.log("[SearchEngine] No valid candidate found after scanning. Fallback found with candidate '%s'. Creating a new candidate from this one.", fallbackCandidate.id);
      const recovered = await candidateRepository.recoverCandidate(fallbackCandidate, orderTracker);
      yield { type: "result", candidate: recovered };
    } else {
      logger.log("[SearchEngine] No valid candidate found after scanning.");
      const candidateWithoutRestaurant = await createDefaultCandidateWithoutRestaurant(search.id, searchRepository, candidateRepository);
      yield { type: "result", candidate: candidateWithoutRestaurant };
    }
  }
}

async function processRestaurant(
  discovered: DiscoveredRestaurantProfile,
  search: Search,
  order: number,
  configuration: SearchEngineConfiguration,
  restaurantRepository: RestaurantRepository,
  matchingRepository: MatchingRepository,
  candidateRepository: CandidateRepository,
  google: GooglePlaceConfiguration | undefined,
  tripAdvisor: TripAdvisorConfiguration | undefined,
  locale: string,
  scanner: RestaurantDiscoveryScanner
): Promise<SearchCandidate | undefined> {
  logger.trace("[SearchEngine] Enriching and validating restaurant...");
  const restaurant = await enrichRestaurant(discovered, locale, restaurantRepository, matchingRepository, configuration.matching, google, tripAdvisor);

  const validation = await validateRestaurant(restaurant, search, locale);
  if (!validation.valid) {
    logger.log("[SearchEngine] Restaurant rejected. Reason: %s", validation.rejectionReason);
  }

  if (restaurant) {
    restaurant.profiles.forEach(profile => scanner.addIdentityToExclude(profile));
  }

  return await candidateRepository.create(search.id, restaurant?.id, order + 1, validation.valid ? "Returned" : "Rejected", validation.rejectionReason);
}

function shouldContinueToExploreMoreRestaurants(candidate: SearchCandidate | undefined, scanner: RestaurantDiscoveryScanner): boolean {
  const foundValid = candidate?.status === "Returned";
  return !foundValid && !scanner.isOver;
}

function computeNextCandidateOrder(candidates: { order: number }[] = []): number {
  const maxOrder = candidates.reduce((max, c) => Math.max(max, c.order), 0);
  return maxOrder + 1;
}

async function markSearchAsExhaustedIfNecessary(
  searchId: string,
  finalCandidateFound: SearchCandidate | undefined,
  searchRepository: SearchRepository
) {
  if (!finalCandidateFound || finalCandidateFound.status === "Rejected") {
    searchRepository.markSearchAsExhausted(searchId);
  }
}

function defineRange(range: DistanceRange, configuration: SearchEngineConfiguration): SearchEngineRange {
  switch (range) {
    case "Far":
      return configuration.range.far;
    case "MidRange":
      return configuration.range.midRange;
    default:
    case "Close":
      return configuration.range.close;
  }
}

function createDiscoveryScanner(
  search: {
    latitude: number;
    longitude: number;
    distanceRange: DistanceRange;
    candidates: {
      restaurant: {
        profiles: RestaurantProfile[]
      } | undefined | null
    }[] | undefined
  },
  configuration: SearchEngineConfiguration,
  overpass: OverpassConfiguration | undefined
): RestaurantDiscoveryScanner {
  const { timeoutInMs, rangeInMeters } = defineRange(search.distanceRange, configuration);
  return new RestaurantDiscoveryScanner(
    { latitude: search.latitude, longitude: search.longitude },
    rangeInMeters,
    timeoutInMs,
    configuration.discovery,
    overpass,
    (search.candidates || []).flatMap(candidate => candidate?.restaurant?.profiles || [])
  );
}

async function findSearchOrThrow(searchId: string, searchRepository: SearchRepository) {
  const search = await searchRepository.findByIdWithRestaurantAndProfiles(searchId);
  if (!search) {
    logger.error("[SearchEngine] Error: Search ID '%s' not found.", searchId);
    throw new SearchNotFoundError(searchId);
  }
  return search;
}

async function findLatestCandidateOf(searchId: string | undefined, searchRepository: SearchRepository, candidateRepository: CandidateRepository): Promise<SearchCandidate | undefined> {
  const finalCandidateId = (await searchRepository.findWithLatestCandidateId(searchId))?.latestCandidateId;
  const finalCandidate = finalCandidateId ? await candidateRepository.findById(finalCandidateId, searchId!) : undefined;
  return finalCandidate || undefined;
}

async function createDefaultCandidateWithoutRestaurant(searchId: string, searchRepository: SearchRepository, candidateRepository: CandidateRepository): Promise<SearchCandidate> {
  logger.log("[SearchEngine] Creating default 'No Restaurant Found' candidate.");
  const order = (await searchRepository.findWithLatestCandidateId(searchId))?.order || 0;
  return await candidateRepository.create(searchId, undefined, order + 1, "Rejected", "no_restaurant_found");
}
