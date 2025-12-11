import { Prisma, SearchCandidateStatus, ServiceTimeslot, type Restaurant, type RestaurantIdentity, type SearchCandidate } from "~/generated/prisma/client";
import prisma from "../db/prisma";
import { findGoogleRestaurantByText } from "./google/repository.server";
import { type GoogleRestaurant } from "./google/types.server";
import { fetchAllRestaurantsNearbyWithRetry } from "./overpass/repository.server";
import OpeningHours, { type nominatim_object } from "opening_hours";

class SearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class SearchNotFoundError extends SearchError {
  constructor(searchId: string) {
    super(`Search with ID ${searchId} not found.`);
    this.name = 'SearchNotFoundError';
  }
}

type RestaurantWithIdentities = Restaurant & { identities: RestaurantIdentity[] };
type DiscoverySource = "osm";

interface SearchContext {
  searchId: string;
  coordinates: { latitude: number; longitude: number };
  targetInstant: Date;
  config: SearchDiscoveryConfig;
}

interface DiscoveryState {
  currentRangeMeters: number;
  iterationIndex: number;
  knownIdentities: RestaurantIdentity[];
  nextCandidateOrder: number;
}

interface DiscoveredRestaurant {
  name: string;
  latitude: number;
  longitude: number;
  address: {
    countryCode: string | undefined;
    state: string | undefined;
  } | undefined,
  openingHours: string | undefined;
  externalSource: DiscoverySource;
  externalId: string;
}

interface SearchDiscoveryConfig {
  initialDiscoveryRangeMeters: number;
  discoveryRangeIncreaseMeters: number;
  maxDiscoveryIterations: number;
  googleSearchRadiusMeters: number;
}

const ENV_CONFIG: SearchDiscoveryConfig = {
  initialDiscoveryRangeMeters: Number(import.meta.env.VITE_ENGINE_DEFAULT_INITIAL_DISCOVERY_RANGE_METERS ?? 5000),
  discoveryRangeIncreaseMeters: Number(import.meta.env.VITE_ENGINE_DEFAULT_DISCOVERY_RANGE_INCREASE_METERS ?? 3000),
  maxDiscoveryIterations: Number(import.meta.env.VITE_ENGINE_DEFAULT_MAX_DISCOVERY_ITERATIONS ?? 3),
  googleSearchRadiusMeters: Number(import.meta.env.VITE_ENGINE_DEFAULT_GOOGLE_SEARCH_RADIUS_METERS ?? 50),
};

export async function searchCandidate(
  searchId: string,
  config: SearchDiscoveryConfig = ENV_CONFIG
): Promise<SearchCandidate | null> {
  const search = await prisma.search.findUniqueWithRestaurantAndIdentities(searchId);
  if (!search) {
    throw new SearchNotFoundError(searchId);
  }

  const context: SearchContext = {
    searchId: search.id,
    coordinates: { latitude: search.latitude, longitude: search.longitude },
    targetInstant: computeTargetInstant(search.serviceDate, search.serviceTimeslot),
    config,
  };

  const initialState: DiscoveryState = {
    currentRangeMeters: config.initialDiscoveryRangeMeters,
    iterationIndex: 0,
    knownIdentities: (search.candidates || []).flatMap(c => c.restaurant?.identities || []),
    nextCandidateOrder: ((search.candidates || []).reduce((max, c) => Math.max(max, c.order), 0)) + 1,
  };

  return runDiscoveryPhase(context, initialState);
}

async function runDiscoveryPhase(
  context: SearchContext,
  state: DiscoveryState
): Promise<SearchCandidate | null> {
  if (state.iterationIndex < context.config.maxDiscoveryIterations) {
    console.log(`Phase ${state.iterationIndex + 1}: Searching ${state.currentRangeMeters}m range...`);

    const discoveries = await discoverNearbyRestaurants(context, state);
    const prioritized = prioritizeAndShuffle(discoveries);
    const result = await processCandidatesSequence(context, state, prioritized);

    if (isSearchCandidate(result)) {
      return result;
    } else {
      return runDiscoveryPhase(context, {
        ...result,
        iterationIndex: state.iterationIndex + 1,
        currentRangeMeters: state.currentRangeMeters + context.config.discoveryRangeIncreaseMeters
      });
    }
  } else {
    return null;
  }
}

/**
 * Recursively processes a list of potential candidates.
 * Returns a SearchCandidate if found (Success), or the updated DiscoveryState if the list is exhausted (Failure).
 */
async function processCandidatesSequence(
  context: SearchContext,
  currentState: DiscoveryState,
  candidates: DiscoveredRestaurant[]
): Promise<SearchCandidate | DiscoveryState> {
  if (candidates.length === 0) {
    return currentState;
  } else {
    const [head, ...tail] = candidates;
    const details = await findAndDetailRestaurant(head, context.config.googleSearchRadiusMeters);

    if (details) {
      const savedCandidate = await createCandidateRecord(context.searchId, details, currentState.nextCandidateOrder, context.targetInstant);
      if (savedCandidate.status === SearchCandidateStatus.Returned) {
        console.log(`Winner: ${details.name}`);
        return savedCandidate;
      } else {
        console.log(`Rejected: ${details.name}`);
        return processCandidatesSequence(context, {
          ...currentState,
          nextCandidateOrder: currentState.nextCandidateOrder + 1,
          knownIdentities: [...currentState.knownIdentities, ...identitiesFromPartial(details)]
        }, tail);
      }
    } else {
      console.log(`Skipped: ${head.name} (Not found in detail provider)`);
      return processCandidatesSequence(context, currentState, tail);
    }
  }
}

async function discoverNearbyRestaurants(
  context: SearchContext,
  state: DiscoveryState
): Promise<DiscoveredRestaurant[]> {
  const osmRestaurants = await findRestaurantsFromApi("osm", context, state);
  return osmRestaurants.filter(restaurant => isOpenAtTarget(restaurant.openingHours, restaurant.latitude, restaurant.longitude, restaurant.address?.countryCode, restaurant.address?.state, context.targetInstant));
}

async function findRestaurantsFromApi(
  source: DiscoverySource,
  context: SearchContext,
  state: DiscoveryState
): Promise<DiscoveredRestaurant[]> {
  if (source === "osm") {
    const response = await fetchAllRestaurantsNearbyWithRetry(
      context.coordinates.latitude,
      context.coordinates.longitude,
      state.currentRangeMeters
    );

    const excludedIds = state.knownIdentities
      .filter(id => id.source === "osm")
      .map(id => id.externalId);

    return (response?.restaurants || [])
      .filter(restaurant => !excludedIds.includes(restaurant.id.toString()))
      .map(restaurant => ({
        name: restaurant.name,
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
        address: {
          countryCode: restaurant.addressCountry,
          state: restaurant.addressState
        },
        externalSource: "osm",
        externalId: restaurant.id.toString(),
        openingHours: restaurant.openingHours // TODO sanitize to be supported by the lib and try https://openingh.openstreetmap.de/evaluation_tool/
      }));
  } else {
    return [];
  }
}

function prioritizeAndShuffle(restaurants: DiscoveredRestaurant[]): DiscoveredRestaurant[] {
  return [...restaurants]; // TODO: Add shuffling/ranking logic
}

async function findAndDetailRestaurant(
  discovery: DiscoveredRestaurant,
  googleRadius: number
): Promise<Partial<RestaurantWithIdentities> | null> {
  const local = await prisma.restaurant.findFirst({
    where: {
      identities: { some: { source: discovery.externalSource, externalId: discovery.externalId } }
    },
    include: { identities: true }
  });

  if (local) {
    return local; // TODO: Add logic to complete details if missing
  } else {
    const googleRestaurant = await findGoogleRestaurantByText(
      discovery.name,
      discovery.latitude,
      discovery.longitude,
      googleRadius
    );
    return convertGoogleToDomain(googleRestaurant, discovery);
  }
}

async function createCandidateRecord(
  searchId: string,
  data: Partial<RestaurantWithIdentities>,
  order: number,
  targetInstant: Date
): Promise<SearchCandidate> {

  const restaurant: Partial<RestaurantWithIdentities> = data.id
    ? data
    : await prisma.restaurant.create({
      data: {
        name: data.name!,
        latitude: data.latitude!,
        longitude: data.longitude!,
        address: data.address,
        rating: data.rating,
        phoneNumber: data.phoneNumber,
        priceRange: data.priceRange,
        tags: data.tags,
        openingHours: data.openingHours,
        identities: { createMany: { data: data.identities as RestaurantIdentity[] } }
      }
  });

  const status = detectCandidateStatus(restaurant, targetInstant);

  return prisma.searchCandidate.create({
    data: {
      searchId: searchId,
      restaurantId: restaurant.id!,
      order: order,
      status: status.status,
      rejectionReason: status.reason,
    }
  });
}

function computeTargetInstant(date: Date, timeslot: ServiceTimeslot): Date {
  switch (timeslot) {
    case ServiceTimeslot.Lunch:
      var target = new Date(date);
      target.setHours(12, 30, 0, 0);
      return target;
    case ServiceTimeslot.Dinner:
      var target = new Date(date);
      target.setHours(19, 30, 0, 0);
      return target;
    default:
      return new Date();
  }
}

function isOpenAtTarget(
  openingHours: string | null | undefined,
  latitude: number,
  longitude: number,
  countryCode: string | undefined | null,
  state: string | undefined | null,
  instant: Date
): boolean | null {
  if (!openingHours) {
    return null;
  } else {
    try {
      return new OpeningHours(openingHours, {
          lat: latitude,
          lon: longitude,
          address: {
            country_code: countryCode?.toLowerCase() ?? "be", // TODO opening_hours does not seem to work very well with "PH"
            state: state ?? ""
          }
        }).getState(instant);
    } catch (e) {
      console.error("Opening hours parsing failed for", openingHours, e);
      return null;
    }
  }
}

function detectCandidateStatus(restaurant: Partial<RestaurantWithIdentities>, instant: Date): {
  status: SearchCandidateStatus,
  reason?: string
} {
  // TODO add more logic
  if (restaurant) {
    if (isOpenAtTarget(restaurant.openingHours, restaurant.latitude!, restaurant.longitude!, restaurant.countryCode, restaurant.state,  instant)) {
      return {
        status: SearchCandidateStatus.Returned
      };
    } else {
      return {
        status: SearchCandidateStatus.Rejected,
        reason: "closed"
      };
    }
  } else {
    return {
      status: SearchCandidateStatus.Rejected,
      reason: "no_restaurant"
    };
  }
}

function convertGoogleToDomain(
  google: GoogleRestaurant | null,
  discovery: DiscoveredRestaurant
): Partial<RestaurantWithIdentities> | null {
  if (google) {
    return {
      name: google.displayName?.text ?? google.name ?? discovery.name,
      latitude: google.location.latitude ?? discovery.latitude,
      longitude: google.location.longitude ?? discovery.longitude,
      address: google.formattedAddress,
      rating: google.rating ? new Prisma.Decimal(google.rating) : null,
      phoneNumber: google.internationalPhoneNumber,
      priceRange: google.toPriceLevelAsNumber(),
      tags: google.types,
      openingHours: google?.toOsmOpeningHours() || discovery.openingHours, // TODO implement a converter from "weekdayDescriptions" to opening_hours
      identities: [
        { source: discovery.externalSource, externalId: discovery.externalId },
        { source: "google_place_api", externalId: google.id }
      ] as RestaurantIdentity[]
    };
  } else {
    return null;
  }
}

function identitiesFromPartial(restaurant: Partial<RestaurantWithIdentities>): RestaurantIdentity[] {
  return restaurant?.identities || [];
}

function isSearchCandidate(obj: any): obj is SearchCandidate {
  return obj && typeof obj.status === "string" && "restaurantId" in obj;
}
