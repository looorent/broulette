import { Prisma, SearchCandidateStatus, type Restaurant, type RestaurantIdentity, type SearchCandidate } from "~/generated/prisma/client";
import prisma from "../db/prisma";
import { findGoogleRestaurantByText } from "./google/repository.server";
import { type GoogleRestaurant } from "./google/types.server";
import { fetchAllRestaurantsNearbyWithRetry } from "./overpass/repository.server";

// --- Types ---
type RestaurantWithIdentities = Restaurant & { identities: RestaurantIdentity[] };

// Represents a restaurant found from a quick external source (e.g., Overpass)
interface DiscoveredRestaurant {
  name: string;
  latitude: number;
  longitude: number;
  closed: boolean | null;
  externalSource: string;
  externalId: string;
}

// --- Constants ---
const DEFAULT_DISTANCE_METERS = 5000;
const GOOGLE_SEARCH_RADIUS_METERS = 50;

/**
 * Orchestrates the three-step process: Discovery, Prioritization, and Detailing
 * to find and return the best new restaurant candidate for a search.
 * This also saves all the intermediate Candidates that could be found.
 * @param searchId The ID of the search to find candidates for.
 * @returns The newly created SearchCandidate in 'Returned' status, or null.
 */
export async function searchCandidate(searchId: string): Promise<SearchCandidate | null> {
  try {
    const search = await prisma.search.findUniqueWithRestaurantAndIdentities(searchId);

    if (!search) {
      // TODO throw a custom business error
      console.error(`Search with ID ${searchId} not found.`);
      return null;
    }

    const identitiesAlreadyInCandidates = search.candidates?.flatMap(candidate => candidate.restaurant?.identities || []) || [];

    // --- STEP 1: Discovery (Get a light list of nearby restaurants) ---
    const discoveredRestaurants = await discoverNearbyRestaurants(
      search.latitude,
      search.longitude,
      DEFAULT_DISTANCE_METERS,
      identitiesAlreadyInCandidates
    );
    console.log(`Discovered ${discoveredRestaurants.length} new potential restaurants.`);

    // --- STEP 2: Prioritization/Randomization ---
    const prioritizedRestaurants = prioritizeAndShuffle(discoveredRestaurants);
    console.log("Restaurants prioritized for detailing.");

    // --- STEP 3: Detailing, Filtering, and Candidate Creation ---
    let createdCandidate: SearchCandidate | null = null;
    for (const restaurantNearby of prioritizedRestaurants) {
      if (createdCandidate && createdCandidate.status === SearchCandidateStatus.Returned) {
        break;
      } else {
        const details = await findAndDetailRestaurant(restaurantNearby);

        if (details) {
          createdCandidate = await processRestaurantForCandidate(searchId, details, search.candidates);
          if (createdCandidate.status === SearchCandidateStatus.Returned) {
            console.log(`Found and returned viable candidate: ${details.name}`);
          } else {
            console.log(`Found but not viable: ${details.name}`);
          }
        } else {
          console.log("Restaurant has not been found in other datasources", restaurantNearby.name);
        }
      }
    }

    // Reload the candidate to ensure all relations are available if needed by the caller
    if (createdCandidate) {
      return prisma.searchCandidate.findUnique({
        where: { id: createdCandidate.id }
      });
    } else {
      return null;
    }
  } catch (error) {
    // TODO throw a custom business error
    console.error(`Error in searchCandidate for ID ${searchId}:`, error);
    return null;
  }
}

// --- STEP 1 Functions: Discovery ---

/**
 * Fetches restaurants from external sources (e.g., Overpass) and filters out existing ones.
 */
async function discoverNearbyRestaurants(
  latitude: number,
  longitude: number,
  distanceRangeInMeters: number,
  identitiesToExclude: RestaurantIdentity[] = []
): Promise<DiscoveredRestaurant[]> {
  const overpassResponse = await fetchAllRestaurantsNearbyWithRetry(latitude, longitude, distanceRangeInMeters);

  // Filter out Overpass/OSM restaurants that have already been processed
  const overpassIdentitiesToExclude = identitiesToExclude.filter(restaurant => restaurant.source === "osm");

  return overpassResponse?.restaurants?.filter(restaurant => {
    return !overpassIdentitiesToExclude.some(identity => identity.externalId === restaurant.id.toString());
  })?.map(restaurant => ({
    name: restaurant.name,
    latitude: restaurant.latitude,
    longitude: restaurant.longitude,
    externalSource: "osm",
    externalId: restaurant.id.toString(),
    closed: null,
  }))?.filter(restaurant => restaurant.closed !== true) || [];
}

// --- STEP 2 Functions: Prioritization/Randomization ---

/**
 * Applies business logic for randomization and prioritization.
 * Currently, this is a simple pass-through.
 * @param restaurants The list of discovered restaurants.
 * @returns The prioritized/shuffled list.
 */
function prioritizeAndShuffle(restaurants: DiscoveredRestaurant[]): DiscoveredRestaurant[] {
  // TODO: Implement actual business randomization/ranking logic here (e.g., weighting
  // by distance, external popularity, or simple random shuffle).
  return restaurants;
}

// --- STEP 3 Functions: Detailing, Filtering, and Candidate Creation ---

/**
 * Checks the database for an existing restaurant, or tries to find and convert one from Google.
 */
async function findAndDetailRestaurant(restaurantNearby: DiscoveredRestaurant): Promise<Partial<RestaurantWithIdentities> | null> {
  // 1. Check local database for match
  let existingRestaurant = await prisma.restaurant.findFirst({
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

  // 2. If it exists, check for completion/update logic
  if (existingRestaurant) {
    const mustBeCompleted = false; // TODO: Check if restaurant is missing critical data (e.g., address, rating)
    if (mustBeCompleted) {
      // TODO: Logic to complete the restaurant data
      return existingRestaurant;
    } else {
      return existingRestaurant;
    }
  } else {
    // 3. No restaurant found in the database, try to find details on Google
    return await findRestaurantInGoogle(restaurantNearby);
  }
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
 */
async function processRestaurantForCandidate(
  searchId: string,
  matchingRestaurant: Partial<RestaurantWithIdentities>,
  existingCandidates: Array<{ order: number } | null> = []
): Promise<SearchCandidate> {
  let savedRestaurant: Restaurant | null;

  // Use the name, latitude, and longitude properties which are always expected to be present.
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
    savedRestaurant = await prisma.restaurant.findUnique({ where: { id: matchingRestaurant.id } });
  } else {
    // Create new restaurant record
    savedRestaurant = await prisma.restaurant.create({
      data: {
        ...restaurantData,
        identities: {
          createMany: {
            // Need to assert type as Partial<RestaurantWithIdentities> ensures identities is there for creation
            data: matchingRestaurant.identities as RestaurantIdentity[]
          }
        }
      },
    });
  }

  if (!savedRestaurant) {
    // TODO business error
    throw new Error(`Failed to retrieve or create restaurant for candidate: ${matchingRestaurant.name}`);
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


// TODO find another name that explains the restaurant has been found (cool), but it does not match some criteria (and also return a string , the "reason")
/**
 * Checks if a restaurant meets the criteria to be returned as a candidate.
 */
function isViable(restaurant: Restaurant): boolean {
  // TODO: Implement actual viability criteria based on search parameters
  return true;
}

function convertGoogleRestaurantToRestaurant(
  google: GoogleRestaurant,
  restaurantNearby: DiscoveredRestaurant
): Partial<RestaurantWithIdentities | null> {
  if (google) {

    return {
      // Name, lat, lon fallback to Overpass data if missing from Google
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
