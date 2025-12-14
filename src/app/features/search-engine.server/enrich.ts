import { DEFAULT_ENRICHMENT_CONFIGURATION, GOOGLE_PLACE_SOURCE_NAME, OVERPASS_SOURCE_NAME } from "@config";
import prisma from "@features/db.server/prisma";
import { findGoogleRestaurantById, findGoogleRestaurantByText, type GoogleRestaurant } from "@features/google.server";
import { findSourceIn } from "@features/restaurant.server";
import { Prisma } from "@persistence/client";
import type { DiscoveredRestaurant, DiscoveredRestaurantIdentity } from "./discovery";


//// TODO !!!! URGENT : If no enrichment has been possible for a restaurant, we should not retry it everytime.

export interface EnrichmentConfig {
  google: {
    source: string;
    searchRadiusInMeters: number;
  },
  osm: {
    source: string;
  }
}

async function findRestaurantInDatabase(identity: DiscoveredRestaurantIdentity) {
  return await prisma.restaurant.findFirst({
    where: {
      identities: {
        some: {
          externalId: identity.externalId,
          source: identity.source
        }
      }
    },
    include: {
      identities: true
    }
  });
}

function filterTags(tags: string[] | undefined): string[] {
  return tags || []; // TODO
}

async function createRestaurant(discovered: DiscoveredRestaurant) {
  return await prisma.restaurant.create({
    data: {
      name: discovered.name!,
      latitude: discovered.coordinates.latitude!,
      longitude: discovered.coordinates.longitude!,
      tags: filterTags(discovered.tags),
      openingHours: discovered.openingHours,
      identities: { create: discovered.identity }
    },
    include: {
      identities: true
    }
  });
}

// TODO does not seem ok
function isOlderThanAMonth(date: Date): boolean {
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
  const timeDifference = Date.now() - date.getTime();
  return timeDifference > thirtyDaysInMs;
}

type RestaurantWithIdentities = Prisma.RestaurantGetPayload<{
  include: {
    identities: true;
  }
}>

function doesNeedEnrichment(restaurant: RestaurantWithIdentities): boolean {
  const source = findSourceIn(restaurant.identities);
  return source === OVERPASS_SOURCE_NAME
    || source === GOOGLE_PLACE_SOURCE_NAME && isOlderThanAMonth(restaurant.updatedAt)
}


export async function enrichRestaurant(
  discovered: DiscoveredRestaurant | undefined,
  configuration: EnrichmentConfig = DEFAULT_ENRICHMENT_CONFIGURATION
): Promise<RestaurantWithIdentities | null> {
  if (discovered) {
    const restaurant = await findRestaurantInDatabase(discovered.identity) || await createRestaurant(discovered);
    if (doesNeedEnrichment(restaurant)) {
      return await enrich(restaurant, configuration);
    } else {
      return restaurant;
    }
  } else {
    return null;
  }
}

// TODO IMPORTANT, manage the fact that we have already tried to find the restaurant on Google, to avoid too many calls
async function enrich(restaurant: RestaurantWithIdentities, configuration: EnrichmentConfig): Promise<RestaurantWithIdentities> {
  return await enrichWithGoogle(restaurant, configuration);
}

async function enrichWithGoogle(
  restaurant: RestaurantWithIdentities,
  configuration: EnrichmentConfig
): Promise<RestaurantWithIdentities> {
  const googleIdentity = restaurant.identities.find(identity => identity.source === configuration.google.source);

  let googleRestaurant: GoogleRestaurant | undefined;
  if (googleIdentity) {
    googleRestaurant = await findGoogleRestaurantById(googleIdentity.externalId);
  } else {
    googleRestaurant = await findGoogleRestaurantByText(
      restaurant.name, // TODO use another attributes to search
      restaurant.latitude,
      restaurant.longitude,
      configuration.google.searchRadiusInMeters
    );
    if (googleRestaurant) {
      const newIdentity = await prisma.restaurantIdentity.create({
        data: {
          source: configuration.google.source,
          restaurantId: restaurant.id,
          type: "google_place_api",
          externalId: googleRestaurant.id
        }
      })
      restaurant.identities.push(newIdentity);
    }
  }

  return updateRestaurantWithGoogle(googleRestaurant, restaurant);
}

async function updateRestaurantWithGoogle(
  google: GoogleRestaurant | undefined,
  restaurant: RestaurantWithIdentities
): Promise<RestaurantWithIdentities> {
  if (google) {
    const countryCode = google.addressComponents?.find(component => component?.types?.includes("country"));
    return await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: {
        name: google.displayName?.text ?? google.name ?? restaurant.name,
        latitude: google.location.latitude ?? restaurant.latitude,
        longitude: google.location.longitude ?? restaurant.longitude,
        version: restaurant.version + 1,
        address: google.formattedAddress ?? restaurant.address,
        rating: (google.rating ? new Prisma.Decimal(google.rating) : null) ?? restaurant.rating,
        phoneNumber: google.internationalPhoneNumber ?? restaurant.phoneNumber,
        priceRange: google.toPriceLevelAsNumber() ?? restaurant.priceRange,
        tags: google.types ?? restaurant.tags,
        openingHours: google?.toOsmOpeningHours() || restaurant.openingHours,
        countryCode: countryCode?.shortText?.toLowerCase() || restaurant.countryCode,
        // description: restaurant.description,
        // imageUrl: restaurant.imageUrl,
      },
      include: {
        identities: true
      }
    });
  } else {
    return restaurant;
  }
}
