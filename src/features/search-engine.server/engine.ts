import { RestaurantDiscoveryScanner, type DiscoveredRestaurantProfile } from "@features/discovery.server";
import { DEFAULT_GOOGLE_PLACE_CONFIGURATION, type GooglePlaceConfiguration } from "@features/google.server";
import { enrichRestaurant } from "@features/matching.server";
import { DEFAULT_OVERPASS_CONFIGURATION, type OverpassConfiguration } from "@features/overpass.server";
import { DEFAULT_TRIPADVISOR_CONFIGURATION, type TripAdvisorConfiguration } from "@features/tripadvisor.server";
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
  console.log(`[SearchEngine] searchCandidate: Starting search for searchId="${searchId}"`);

  yield { type: "searching", message: MESSAGES[Math.floor(Math.random() * MESSAGES.length)] };

  const search = await findSearchOrThrow(searchId, searchRepository);

  if (search.exhausted) {
    yield { type: "exhausted", message: "We've seen it all. Let's find a fallback." };
    console.log(`[SearchEngine] Search "${searchId}" is already exhausted. Returning fallback candidate.`);
    const candidate = await findLatestCandidateOf(search.id, searchRepository, candidateRepository) || await createDefaultCandidateWithoutRestaurant(search.id, searchRepository, candidateRepository);
    yield { type: "result", candidate };
  } else {
    const scanner = createDiscoveryScanner(search, configuration, overpass);
    const startingOrder = computeNextCandidateOrder(search.candidates);
    console.log(`[SearchEngine] Initializing discovery for searchId="${searchId}". Starting order: ${startingOrder}`);

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
    .filter(Boolean);

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

  while (shouldContinueToExploreMoreRestaurants(candidate, scanner)) {
    const restaurants = await scanner.nextRestaurants(signal);
    if (restaurants.length > 0) {
      console.log(`[SearchEngine] Processing batch of ${restaurants.length} discovered restaurants...`);
      yield { type: "batch-discovered", count: restaurants.length, message: `${restaurants.length} options detected! Digging in...` };
      yield* simulateFastChecking(await randomize(restaurants));
      for (const restaurant of await randomize(restaurants)) {
        if (candidate?.status !== "Returned") {
          yield { type: "checking-restaurants", restaurantNames: [restaurant.name || "?!?"]};
          const processed = await processRestaurant(restaurant, search, orderTracker++, config, restaurantRepository, matchingRepository, candidateRepository, google, tripAdvisor, locale, scanner);
          if (processed) {
            candidate = processed;
            console.log(`[SearchEngine] Candidate found: ${candidate.id} (Status: ${candidate.status})`);
          }
        } else {
          break;
        }
      }
    }
  }

  if (candidate) {
    console.log(`[SearchEngine] Candidate found after scanning: '${candidate.id}' in status '${candidate.status}'.`);
    yield { type: "result", candidate };
  } else {
    yield { type: "looking-for-fallbacks", message: "No winners yet. Checking the rejects..." };
    console.log(`[SearchEngine] No valid candidate found after scanning. Trying to find a fallback...`);
    const fallbackCandidate = await candidateRepository.findBestRejectedCandidateThatCouldServeAsFallback(search.id);
    if (fallbackCandidate) {
      console.log(`[SearchEngine] No valid candidate found after scanning. Fallback found with candidate '${fallbackCandidate.id}'. Creating a new candidate from this one.`);
      const recovered = await candidateRepository.recoverCandidate(fallbackCandidate, orderTracker);
      yield { type: "result", candidate: recovered };
    } else {
      console.log(`[SearchEngine] No valid candidate found after scanning.`);
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
  console.trace(`[SearchEngine] Enriching and validating restaurant...`);
  const restaurant = await enrichRestaurant(discovered, locale, restaurantRepository, matchingRepository, configuration.matching, google, tripAdvisor);

  const validation = await validateRestaurant(restaurant, search, locale);
  if (!validation.valid) {
    console.log(`[SearchEngine] Restaurant rejected. Reason: ${validation.rejectionReason}`);
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
    console.error(`[SearchEngine] Error: Search ID "${searchId}" not found.`);
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
  console.log(`[SearchEngine] Creating default 'No Restaurant Found' candidate.`);
  const order = (await searchRepository.findWithLatestCandidateId(searchId))?.order || 0;
  return await candidateRepository.create(searchId, undefined, order + 1, "Rejected", "no_restaurant_found");
}
