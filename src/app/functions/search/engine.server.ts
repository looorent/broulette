import type { Decimal } from "@prisma/client/runtime/client";
import { Prisma, SearchCandidateStatus, type Restaurant, type RestaurantIdentity, type SearchCandidate } from "~/generated/prisma/client";
import prisma from "../db/prisma";
import { findGoogleRestaurantByText } from "./google/repository.server";
import type { GoogleRestaurant } from "./google/types.server";
import { fetchAllRestaurantsNearbyWithRetry } from "./overpass/repository.server";

type RestaurantWithIdentities = Restaurant & { identities: RestaurantIdentity[] };

interface RestaurantNearby {
  name: string;
  latitude: number;
  longitude: number;
  closed: boolean | null;
  externalSource: string;
  externalId: string;
}

export async function searchCandidate(searchId: string): Promise<SearchCandidate | null> {
  // TODO manage error
  const search = await prisma.search.findUniqueOrThrow({
    where: {
      id: searchId
    },
    include: {
      candidates: {
        include: {
          restaurant: {
            include: {
              identities: true
            }
          }
        }
      }
    }
  });

  const distanceRangeInMeters = 5000; // TODO use search
  const identitiesAlreadyPartsInCandidates = search.candidates?.flatMap(candidate => candidate.restaurant?.identities || []) || [];
  const restaurantsNearby = await findRestaurantsNearby(search.latitude, search.longitude, distanceRangeInMeters, identitiesAlreadyPartsInCandidates);

  // TODO create the candidate in a Pending State, WITHOUT restaurant!.

  console.log("Restaurants ", restaurantsNearby);
  console.log("identitiesAlreadyPartsInCandidates ", identitiesAlreadyPartsInCandidates);

  let candidate: SearchCandidate | null = null;

  for (let index = 0; index < restaurantsNearby.length && (candidate === null || candidate === undefined || candidate.status !== SearchCandidateStatus.Returned); index++) {
    const restaurantNearby = restaurantsNearby[index];

    let matchingRestaurant: RestaurantWithIdentities | null = null;

    ////////////////
    // If the corresponding restaurant is already in the database, use it to check the data available
    const existingRestaurant = (await prisma.restaurant.findFirst({
      where: {
        identities: {
          some: {
            source: restaurantNearby.externalSource,
            externalId: restaurantNearby.externalId
          }
        }
      },
      include: {
        identities: true
      }
    }));
    if (existingRestaurant) {
      // Complete the restaurant if required (for example, if it does not contain the opening hours)
      const mustBeCompleted = false; // TODO do better
      if (mustBeCompleted) {
        // TODO do stuff
        matchingRestaurant = existingRestaurant;
      } else {
        matchingRestaurant = existingRestaurant;
      }
    } else {
      // No restaurant found in the database, try to find it on Google
      matchingRestaurant = await findRestaurantInGoogle(restaurantNearby);
    }
    ////////////////

    // Now, we should have found a restaurant matching the restaurant nearby
    if (matchingRestaurant) {
      // we reload it to make sure we have everything
      // TODO it could be done before, right?
      const savedRestaurant = matchingRestaurant.id && matchingRestaurant.id.length > 0 ? await prisma.restaurant.findFirst({
        where: {
          id: matchingRestaurant.id
        },
        include: {
          identities: true
        }
      }) : await prisma.restaurant.create({
        data: {
          name: matchingRestaurant.name,
          latitude: matchingRestaurant.latitude,
          longitude: matchingRestaurant.longitude,
          address: matchingRestaurant.address,
          description: matchingRestaurant.description,
          rating: matchingRestaurant.rating,
          imageUrl: matchingRestaurant.imageUrl,
          phoneNumber: matchingRestaurant.phoneNumber,
          priceRange: matchingRestaurant.priceRange,
          tags: matchingRestaurant.tags,
          identities: {
            createMany: {
              data: matchingRestaurant.identities
            }
          }
        },
      });

      // Create the candidate and save it (even if it is rejected)
      if (savedRestaurant) {
        // TODO get latest order with a more performant method
        const latestCandidate = (await prisma.search.findWithLatestCandidate(search.id))?.candidates?.[0];
        const lastOrder = latestCandidate?.order || 1;

        // TODO we should update the candidate here
        candidate = await prisma.searchCandidate.create({
          data: {
            order: lastOrder + 1, // TODO
            restaurantId: savedRestaurant.id,
            searchId: search.id,
            status: isViable(matchingRestaurant) ? SearchCandidateStatus.Returned : SearchCandidateStatus.Rejected, // TODO define the reason
          }
        });
      } else {
        // TODO is this even possible?
        console.log("NOT POSSIBLE TODO");
      }
    }
  }

  if (candidate) {
    return await prisma.searchCandidate.findUnique({
      where: {
        id: candidate.id
      }
    });
  } else {
    return null;
  }
}



// TODO add other sources
async function findRestaurantsNearby(
  latitude: number,
  longitude: number,
  distanceRangeInMeters: number,
  restaurantsToExclude: RestaurantIdentity[] = [] // TODO improve performance with some kind of index or hash
): Promise<RestaurantNearby[]> {
  const overpassResponse = await fetchAllRestaurantsNearbyWithRetry(latitude, longitude, distanceRangeInMeters)
  // TODO manage errors and use other API

  const overpassRestaurantsToExclude = restaurantsToExclude.filter(restaurant => restaurant.source === "osm");
  return overpassResponse?.restaurants?.filter(restaurant => {
    // remove the restaurants that has been loaded already
    return !overpassRestaurantsToExclude.some(restaurantToExclude => restaurantToExclude.externalId === restaurant.id.toString() )
  })?.map(restaurant => ({
    name: restaurant.name,
    latitude: restaurant.latitude,
    longitude: restaurant.longitude,
    externalSource: "osm",
    externalId: restaurant.id.toString(),
    closed: null, // TODO use opening_hours
  }))?.filter(restaurant => restaurant.closed !== true) || [];
}

// TODO
function isViable(restaurantToReturn: { id: string; latitude: number; longitude: number; createdAt: Date; name: string; updatedAt: Date; address: string | null; description: string | null; imageUrl: string | null; rating: Decimal | null; phoneNumber: string | null; priceRange: number | null; tags: string[]; }): boolean {
  return true;
}

// TODO
async function findRestaurantInGoogle(restaurantNearby: RestaurantNearby): Promise<RestaurantWithIdentities | null> {
  const googleRestaurant = await findGoogleRestaurantByText(restaurantNearby.name, restaurantNearby.latitude, restaurantNearby.longitude, 50); // TODO make this "50 meters" adaptable
  if (googleRestaurant) {
    // TODO add more checks ? (like the name of the restaurant, or other stuff)
    return convertGoogleRestaurantToRestaurant(googleRestaurant, restaurantNearby);
  } else {
    // TODO try another search?
    return null;
  }
}

function convertGoogleRestaurantToRestaurant(google: GoogleRestaurant,
                                             restaurantNearby: RestaurantNearby): any  { // TODO "any" is not right here
  return {
    name: google.displayName?.text ?? google.name ?? restaurantNearby.name,
    latitude: google.location.latitude ?? restaurantNearby.latitude,
    longitude: google.location.longitude ?? restaurantNearby.longitude,
    address: google.adrFormatAddress,
    description: null, // TODO
    imageUrl: null, // TODO
    rating: google.rating ? new Prisma.Decimal(google.rating) : null,
    phoneNumber: google.internationalPhoneNumber,
    priceRange: google.toPriceLevelAsNumber(),
    tags: google.types, // TODO filter
    identities: [
      {
        source: restaurantNearby.externalSource,
        externalId: restaurantNearby.externalId
      },
      {
        source: "google_place_api",
        externalId: google.id
      }
    ]
  };
}
