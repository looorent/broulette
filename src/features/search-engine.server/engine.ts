import { RestaurantDiscoveryScanner, type DiscoveredRestaurantProfile, type DiscoveryRestaurantIdentity } from "@features/discovery.server";
import { enrichRestaurant } from "@features/matching.server";
import { logger } from "@features/utils/logger";
import { type CandidateRepository, type DistanceRange, type Search, type SearchCandidate, type SearchRepository } from "@persistence";

import { SearchNotFoundError } from "./error";
import { randomize } from "./randomizer";
import { type SearchContext, type SearchEngineConfiguration, type SearchEngineRange, type SearchStreamEvent } from "./types";
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
  context: SearchContext
): AsyncGenerator<SearchStreamEvent, void, unknown> {
  logger.log("[SearchEngine] searchCandidate: Starting search for searchId='%s'", searchId);

  yield { type: "searching", message: MESSAGES[Math.floor(Math.random() * MESSAGES.length)] };

  const search = await findSearchOrThrow(searchId, context.repositories.search);

  if (search.exhausted) {
    yield { type: "exhausted", message: "We've seen it all. Let's find a fallback." };
    logger.log("[SearchEngine] Search '%s' is already exhausted. Returning fallback candidate.", searchId);
    const candidate = await findLatestCandidateOf(search.id, context.repositories.search, context.repositories.candidate) || await createDefaultCandidateWithoutRestaurant(search.id, context.repositories.search, context.repositories.candidate);
    yield { type: "result", candidate };
  } else {
    const scanner = createDiscoveryScanner(search, context);
    const startingOrder = computeNextCandidateOrder(search.candidates);
    logger.log("[SearchEngine] Initializing discovery for searchId='%s'. Starting order: %d", searchId, startingOrder);

    const generator = findNextValidCandidateStream(search, scanner, startingOrder, locale, context);

    let finalCandidate: SearchCandidate | undefined;
    for await (const event of generator) {
      if (event.type === "result") {
        finalCandidate = event.candidate;
      }
      yield event;
    }

    if (finalCandidate) {
      await markSearchAsExhaustedIfNecessary(search.id, finalCandidate, context.repositories.search);
    }
  }
}

async function* simulateFastChecking(
  restaurants: DiscoveredRestaurantProfile[],
  maxToShow: number = 10
): AsyncGenerator<SearchStreamEvent, void, unknown> {
  const randomized = randomize(restaurants);
  const fakeRestaurantsToShow = randomized.slice(0, Math.min(randomized.length, maxToShow))
    .map(restaurant => restaurant.name!)
    .filter(Boolean) || [];
  if (fakeRestaurantsToShow.length > 0) {
    yield { type: "checking-restaurants", restaurantNames: fakeRestaurantsToShow };
  }
}

async function* findNextValidCandidateStream(
  search: Search,
  scanner: RestaurantDiscoveryScanner,
  currentOrder: number,
  locale: string,
  context: SearchContext
): AsyncGenerator<SearchStreamEvent, void, unknown> {
  let candidate: SearchCandidate | undefined = undefined;
  let orderTracker = currentOrder;

  while (shouldContinueToExploreMoreRestaurants(candidate, scanner) && !context.signal?.aborted) {
    const restaurants = await scanner.nextRestaurants(context.signal);

    if (restaurants.length > 0) {
      const randomized = randomize(restaurants);
      logger.log("[SearchEngine] Processing batch of %d discovered restaurants...", randomized.length);
      yield { type: "batch-discovered", count: randomized.length, message: randomized.length + " options detected! Digging in..." };

      yield* simulateFastChecking(randomized, 10);

      for (const restaurant of randomized) {
        if (candidate?.status !== "Returned") {
          if (context.signal?.aborted) {
            break;
          } else {
            yield { type: "checking-restaurants", restaurantNames: [restaurant.name || "?!?"]};
            const processed = await processRestaurant(restaurant, search, orderTracker++, locale, scanner, context);
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
    const fallbackCandidate = await context.repositories.candidate.findBestRejectedCandidateThatCouldServeAsFallback(search.id);
    if (fallbackCandidate) {
      logger.log("[SearchEngine] No valid candidate found after scanning. Fallback found with candidate '%s'. Creating a new candidate from this one.", fallbackCandidate.id);
      const recovered = await context.repositories.candidate.recoverCandidate(fallbackCandidate, orderTracker);
      yield { type: "result", candidate: recovered };
    } else {
      logger.log("[SearchEngine] No valid candidate found after scanning.");
      const candidateWithoutRestaurant = await createDefaultCandidateWithoutRestaurant(search.id, context.repositories.search, context.repositories.candidate);
      yield { type: "result", candidate: candidateWithoutRestaurant };
    }
  }
}

async function processRestaurant(
  discovered: DiscoveredRestaurantProfile,
  search: Search,
  order: number,
  locale: string,
  scanner: RestaurantDiscoveryScanner,
  context: SearchContext
): Promise<SearchCandidate | undefined> {
  logger.trace("[SearchEngine] Enriching and validating restaurant...");
  const restaurant = await enrichRestaurant(discovered, locale, context.repositories.restaurant, context.repositories.matching, context.config.matching, context.services.google, context.services.tripAdvisor, context.signal);

  const validation = await validateRestaurant(restaurant, search, locale);
  if (!validation.valid) {
    logger.log("[SearchEngine] Restaurant rejected. Reason: %s", validation.rejectionReason);
  }

  if (restaurant) {
    restaurant.profiles.forEach(profile => scanner.addIdentityToExclude(profile));
  }

  return await context.repositories.candidate.create(search.id, restaurant?.id, order + 1, validation.valid ? "Returned" : "Rejected", validation.rejectionReason);
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

function defineRange(range: DistanceRange, config: SearchEngineConfiguration): SearchEngineRange {
  switch (range) {
    case "Far":
      return config.range.far;
    case "MidRange":
      return config.range.midRange;
    default:
    case "Close":
      return config.range.close;
  }
}

function createDiscoveryScanner(
  search: {
    latitude: number;
    longitude: number;
    distanceRange: DistanceRange;
    candidates: {
      restaurant: {
        profiles: DiscoveryRestaurantIdentity[]
      } | undefined | null
    }[] | undefined
  },
  context: SearchContext
): RestaurantDiscoveryScanner {
  const { timeoutInMs, rangeInMeters } = defineRange(search.distanceRange, context.config);
  return new RestaurantDiscoveryScanner(
    { latitude: search.latitude, longitude: search.longitude },
    rangeInMeters,
    timeoutInMs,
    context.config.discovery,
    context.services.overpass,
    (search.candidates || []).flatMap(candidate => candidate?.restaurant?.profiles || [])
  );
}

async function findSearchOrThrow(searchId: string, searchRepository: SearchRepository) {
  const search = await searchRepository.findByIdWithCandidateContext(searchId);
  if (!search) {
    logger.error("[SearchEngine] Error: Search ID '%s' not found.", searchId);
    throw new SearchNotFoundError(searchId);
  }
  return search;
}

async function findLatestCandidateOf(searchId: string, searchRepository: SearchRepository, candidateRepository: CandidateRepository): Promise<SearchCandidate | undefined> {
  const finalCandidateId = (await searchRepository.findWithLatestCandidateId(searchId))?.latestCandidateId;
  const finalCandidate = finalCandidateId ? await candidateRepository.findById(finalCandidateId, searchId) : undefined;
  return finalCandidate || undefined;
}

async function createDefaultCandidateWithoutRestaurant(searchId: string, searchRepository: SearchRepository, candidateRepository: CandidateRepository): Promise<SearchCandidate> {
  logger.log("[SearchEngine] Creating default 'No Restaurant Found' candidate.");
  const order = (await searchRepository.findWithLatestCandidateId(searchId))?.order || 0;
  return await candidateRepository.create(searchId, undefined, order + 1, "Rejected", "no_restaurant_found");
}
