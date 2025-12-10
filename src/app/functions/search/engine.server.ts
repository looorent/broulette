import { Prisma, SearchCandidateStatus, type Restaurant, type RestaurantIdentity, type SearchCandidate } from "~/generated/prisma/client";
import prisma from "../db/prisma";
import { findGoogleRestaurantByText } from "./google/repository.server";
import { type GoogleRestaurant } from "./google/types.server";
import { fetchAllRestaurantsNearbyWithRetry } from "./overpass/repository.server";

// --- Custom Business Errors ---

class BusinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    // Capturing stack trace up to the current error
    Error.captureStackTrace(this, this.constructor);
  }
}

class SearchNotFoundError extends BusinessError {
  constructor(searchId: string) {
    super(`Search with ID ${searchId} not found.`);
    this.name = 'SearchNotFoundError';
  }
}

class RestaurantCreationError extends BusinessError {
  constructor(restaurantName: string, reason: string) {
    super(`Failed to retrieve or create restaurant: ${restaurantName}. Reason: ${reason}`);
    this.name = 'RestaurantCreationError';
  }
}

// --- Types ---
type RestaurantWithIdentities = Restaurant & { identities: RestaurantIdentity[] };

// Represents a restaurant found from a quick external source.
interface DiscoveredRestaurant {
  name: string;
  latitude: number;
  longitude: number;
  openingHours: string | undefined;
  externalSource: DiscoverySource;
  externalId: string;
}

// Abstracted type for potential discovery sources
// For now, we only have OSM but we will add other sources for resilliency.
type DiscoverySource = "osm";

// --- Constants ---
const INITIAL_DISCOVERY_RANGE_METERS = 5000;
const DISCOVERY_RANGE_INCREASE_METERS = 3000;
const MAX_DISCOVERY_ITERATIONS = 3;
const GOOGLE_SEARCH_RADIUS_METERS = 50;

// --- Main Orchestration Logic ---

/**
 * Orchestrates the three-step process (Discovery, Prioritization, Detailing)
 * to find and return the best new restaurant candidate for a search,
 * iterating on discovery range if necessary.
 * @param searchId The ID of the search to find candidates for.
 * @returns The newly created SearchCandidate in 'Returned' status, or null.
 * @throws {SearchNotFoundError} If the initial search object does not exist.
 */
export async function searchCandidate(searchId: string): Promise<SearchCandidate | null> {
  const search = await prisma.search.findUniqueWithRestaurantAndIdentities(searchId);

  if (!search) {
    throw new SearchNotFoundError(searchId);
  }

  const identitiesAlreadyInCandidates = search.candidates?.flatMap(candidate => candidate.restaurant?.identities || []) || [];

  let currentRange = INITIAL_DISCOVERY_RANGE_METERS;
  let createdCandidate: SearchCandidate | null = null;
  let allDiscovered: DiscoveredRestaurant[] = [];

  for (let iteration = 0; iteration < MAX_DISCOVERY_ITERATIONS; iteration++) {
    // --- STEP 1: Iterative Discovery (Get a light list) ---
    const newDiscoveries = await discoverNearbyRestaurants(
      search.latitude,
      search.longitude,
      currentRange,
      identitiesAlreadyInCandidates.concat(
        allDiscovered.map(d => ({ externalId: d.externalId, source: d.externalSource } as RestaurantIdentity)) // Prevent re-discovery in subsequent iterations
      )
    );

    console.log(`Discovery Iteration ${iteration + 1}: Found ${newDiscoveries.length} new restaurants within ${currentRange}m.`);

    if (newDiscoveries.length === 0 && iteration < MAX_DISCOVERY_ITERATIONS - 1) {
      currentRange += DISCOVERY_RANGE_INCREASE_METERS;
    } else {
      allDiscovered = allDiscovered.concat(newDiscoveries);

      // --- STEP 2: Prioritization/Randomization (Process only the new discoveries this round) ---
      const prioritizedRestaurants = prioritizeAndShuffle(newDiscoveries);
      console.log(`Prioritizing ${prioritizedRestaurants.length} restaurants for detailing.`);

      // --- STEP 3: Detailing, Filtering, and Candidate Creation ---
      createdCandidate = await detailAndCreateCandidate(searchId, prioritizedRestaurants, search.candidates); // TODO I think "search.candidates" is wrong here because it does not take into account the new candidates that have been created during this process

      if (createdCandidate?.status === SearchCandidateStatus.Returned) {
        break;
      } else if (iteration >= MAX_DISCOVERY_ITERATIONS - 1) {
        // If we've hit max range or found no new candidates, stop the loop.
        break;
      } else {
        // Increment range for the next iteration if no viable candidate was found
        currentRange += DISCOVERY_RANGE_INCREASE_METERS;
      }
    }
  }

  return createdCandidate ? prisma.searchCandidate.findUnique({ where: { id: createdCandidate.id } }) : null;
}

// --- STEP 1 Functions: Discovery ---

/**
 * Fetches restaurants from discovery APIs and filters out already processed identities.
 */
async function discoverNearbyRestaurants(
  latitude: number,
  longitude: number,
  distanceRangeInMeters: number,
  identitiesToExclude: RestaurantIdentity[] = []
): Promise<DiscoveredRestaurant[]> {
  const osmRestaurants = await findRestaurantsFromApi("osm", latitude, longitude, distanceRangeInMeters, identitiesToExclude);
  // TODO Gemini: implement the check with "opening_hours" lib. The restaurant might have an optional attribute "openingHours" that can be used to define if the restaurant is closed
  // TODO: Combine with results from other APIs (Yelp, Foursquare) when integrated
  return osmRestaurants;
}

async function findRestaurantsFromApi(
  source: DiscoverySource,
  latitude: number,
  longitude: number,
  distanceRangeInMeters: number,
  identitiesToExclude: RestaurantIdentity[]
): Promise<DiscoveredRestaurant[]> {
  switch (source) {
    case "osm":
      const overpassResponse = await fetchAllRestaurantsNearbyWithRetry(latitude, longitude, distanceRangeInMeters);

      // Filter out identities already processed by this source
      const osmIdentitiesToExclude = identitiesToExclude.filter(identity => identity.source === "osm");

      return overpassResponse?.restaurants?.filter(restaurant => {
        return !osmIdentitiesToExclude.some(identity => identity.externalId === restaurant.id.toString());
      })?.map(restaurant => ({
        name: restaurant.name,
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
        externalSource: "osm" as DiscoverySource,
        externalId: restaurant.id.toString(),
        openingHours: restaurant.openingHours
      })) || [];
    default:
      return [];
  }
}

// --- STEP 2 Functions: Prioritization/Randomization ---

/**
 * Applies business logic for randomization and prioritization.
 */
function prioritizeAndShuffle(restaurants: DiscoveredRestaurant[]): DiscoveredRestaurant[] {
  // TODO: Implement actual business randomization/ranking logic here.
  return restaurants;
}

// --- STEP 3 Orchestration: Detailing, Filtering, and Candidate Creation ---

/**
 * Iterates through prioritized restaurants, finds details, and creates a candidate,
 * stopping and returning the first viable one found.
 */
async function detailAndCreateCandidate(
  searchId: string,
  prioritizedRestaurants: DiscoveredRestaurant[],
  existingCandidates: Array<{ order: number } | null> = []
): Promise<SearchCandidate | null> {
  for (const restaurantNearby of prioritizedRestaurants) {
    const details = await findAndDetailRestaurant(restaurantNearby);

    if (details) {
      const createdCandidate = await processRestaurantForCandidate(searchId, details, existingCandidates);

      if (createdCandidate.status === SearchCandidateStatus.Returned) {
        console.log(`Found and returned viable candidate: ${details.name}`);
        return createdCandidate;
      } else {
        console.log(`Found but not viable: ${details.name}`);
      }
    } else {
      console.log(`Restaurant has not been found in other datasources: ${restaurantNearby.name}`);
    }
  }
  return null;
}

/**
 * Checks the database for an existing restaurant, or tries to find and convert one from Google.
 */
async function findAndDetailRestaurant(restaurantNearby: DiscoveredRestaurant): Promise<Partial<RestaurantWithIdentities> | null> {
  const existingRestaurant = await fetchLocalRestaurant(restaurantNearby);

  if (existingRestaurant) {
    return completeRestaurantDetails(existingRestaurant);
  } else {
    return await findRestaurantInGoogle(restaurantNearby);
  }
}

/**
 * Searches local DB for a matching restaurant based on identity.
 */
function fetchLocalRestaurant(restaurantNearby: DiscoveredRestaurant): Promise<RestaurantWithIdentities | null> {
  return prisma.restaurant.findFirst({
    where: {
      identities: {
        some: {
          source: restaurantNearby.externalSource,
          externalId: restaurantNearby.externalId
        }
      }
    },
    include: { identities: true }
  });
}

/**
 * Handles logic to complete/update restaurant details if required.
 */
function completeRestaurantDetails(restaurant: RestaurantWithIdentities): RestaurantWithIdentities {
  const mustBeCompleted = false; // TODO: Implement logic to check for missing critical data

  if (mustBeCompleted) {
    // TODO: Logic to complete the restaurant data (e.g., fetch opening hours, more details)
  }
  return restaurant;
}

/**
 * Searches Google for full restaurant details based on a light discovery record.
 */
async function findRestaurantInGoogle(restaurantNearby: DiscoveredRestaurant): Promise<Partial<RestaurantWithIdentities> | null> {
  const googleRestaurant = await findGoogleRestaurantByText(
    restaurantNearby.name,
    restaurantNearby.latitude,
    restaurantNearby.longitude,
    GOOGLE_SEARCH_RADIUS_METERS
  );
  return convertGoogleRestaurantToRestaurant(googleRestaurant, restaurantNearby);
}


/**
 * Saves/updates a restaurant in the database and creates a SearchCandidate for it.
 * @throws {RestaurantCreationError} If saving the restaurant fails unexpectedly.
 */
async function processRestaurantForCandidate(
  searchId: string,
  matchingRestaurant: Partial<RestaurantWithIdentities>,
  existingCandidates: Array<{ order: number } | null> = []
): Promise<SearchCandidate> {
  const savedRestaurant = await saveOrUpdateRestaurant(matchingRestaurant);

  if (!savedRestaurant) {
    throw new RestaurantCreationError(matchingRestaurant.name!, "Database operation failed unexpectedly.");
  }

  // Determine the order for the new candidate
  const latestOrder = existingCandidates.reduce((max, c) => c ? Math.max(max, c.order) : max, 0);
  const nextOrder = latestOrder + 1;

  // Create the candidate
  return prisma.searchCandidate.create({
    data: {
      order: nextOrder,
      restaurantId: savedRestaurant.id,
      searchId: searchId,
      status: isViable(savedRestaurant) ? SearchCandidateStatus.Returned : SearchCandidateStatus.Rejected,
    }
  });
}

/**
 * Either retrieves an existing restaurant or creates a new one in the DB.
 */
async function saveOrUpdateRestaurant(matchingRestaurant: Partial<RestaurantWithIdentities>): Promise<Restaurant | null> {
  const restaurantData = {
    name: matchingRestaurant.name!,
    latitude: matchingRestaurant.latitude!,
    longitude: matchingRestaurant.longitude!,
    address: matchingRestaurant.address,
    description: matchingRestaurant.description,
    rating: matchingRestaurant.rating,
    imageUrl: matchingRestaurant.imageUrl,
    phoneNumber: matchingRestaurant.phoneNumber,
    priceRange: matchingRestaurant.priceRange,
    tags: matchingRestaurant.tags,
  };

  if (matchingRestaurant.id) {
    // Restaurant was already in DB
    return prisma.restaurant.findUnique({ where: { id: matchingRestaurant.id } });
  } else {
    // Create new restaurant record
    return prisma.restaurant.create({
      data: {
        ...restaurantData,
        identities: {
          createMany: {
            data: matchingRestaurant.identities as RestaurantIdentity[]
          }
        }
      },
    });
  }
}


/**
 * Checks if a restaurant meets the criteria to be returned as a candidate.
 */
function isViable(restaurant: Restaurant): boolean {
  // TODO: Implement actual viability criteria based on search parameters
  // TODO Gemini: add a check if the Restaurant is opened for the "search" parameters. The search has two attributes:
  // - serviceDate: Date
  // - serviceTimeslot: $Enums.ServiceTimeslot (enum ServiceTimeslot {
  //   Dinner
  //   Lunch
  //   RightNow
  // })
  return true;
}

/**
 * Converts a GoogleRestaurant object and the source DiscoveredRestaurant into a partial local Restaurant object.
 */
function convertGoogleRestaurantToRestaurant(
  google: GoogleRestaurant | null,
  restaurantNearby: DiscoveredRestaurant
): Partial<RestaurantWithIdentities | null> {
  if (google) {
    return {
      name: google.displayName?.text ?? google.name ?? restaurantNearby.name,
      latitude: google.location.latitude ?? restaurantNearby.latitude,
      longitude: google.location.longitude ?? restaurantNearby.longitude,

      address: google.adrFormatAddress,
      description: null,
      imageUrl: null,
      rating: google.rating !== undefined && google.rating !== null
        ? new Prisma.Decimal(google.rating)
        : null,
      phoneNumber: google.internationalPhoneNumber,
      priceRange: google.toPriceLevelAsNumber(),
      tags: google.types,

      identities: [
        {
          source: restaurantNearby.externalSource,
          externalId: restaurantNearby.externalId
        },
        {
          source: "google_place_api",
          externalId: google.id
        }
      ] as RestaurantIdentity[],
    };
  } else {
    return null;
  }
}
