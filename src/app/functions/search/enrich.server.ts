import type { Prisma } from "~/generated/prisma/client";
import prisma from "../db/prisma";
import type { DiscoveredRestaurant } from "./discovery.server";

// googleSearchRadiusMeters: Number(import.meta.env.VITE_ENGINE_DEFAULT_GOOGLE_SEARCH_RADIUS_METERS ?? 50),

export async function enrichRestaurant(discovered: DiscoveredRestaurant | undefined): Promise<Prisma.RestaurantGetPayload<{
  include: {
    identities: true;
  }
}> | null> {
  if (discovered) {
    // TODO
    return prisma.restaurant.findUnique({
      where: {
        id: "hello" // TODO that does not make sense, but that does compile for the moment
      },
      include: {
        identities: true
      }
    });
  } else {
    return null;
  }
}

// async function findAndDetailRestaurant(
//   discovery: DiscoveredRestaurant,
//   googleRadius: number
// ): Promise<Partial<RestaurantWithIdentities> | null> {
//   const local = await prisma.restaurant.findFirst({
//     where: {
//       identities: { some: { source: discovery.externalSource, externalId: discovery.externalId } }
//     },
//     include: { identities: true }
//   });

//   if (local) {
//     return local; // TODO: Add logic to complete details if missing
//   } else {
//     const googleRestaurant = await findGoogleRestaurantByText(
//       discovery.name,
//       discovery.latitude,
//       discovery.longitude,
//       googleRadius
//     );
//     return convertGoogleToDomain(googleRestaurant, discovery);
//   }
// }

// async function createCandidateRecord(
//   searchId: string,
//   data: Partial<RestaurantWithIdentities>,
//   order: number,
//   targetInstant: Date
// ): Promise<SearchCandidate> {

//   const restaurant: Partial<RestaurantWithIdentities> = data.id
//     ? data
//     : await prisma.restaurant.create({
//       data: {
//         name: data.name!,
//         latitude: data.latitude!,
//         longitude: data.longitude!,
//         address: data.address,
//         rating: data.rating,
//         phoneNumber: data.phoneNumber,
//         priceRange: data.priceRange,
//         tags: data.tags,
//         openingHours: data.openingHours,
//         identities: { createMany: { data: data.identities as RestaurantIdentity[] } }
//       }
//     });

//   const status = detectCandidateStatus(restaurant, targetInstant);

//   return prisma.searchCandidate.create({
//     data: {
//       searchId: searchId,
//       restaurantId: restaurant.id!,
//       order: order,
//       status: status.status,
//       rejectionReason: status.reason,
//     }
//   });
// }

// function convertGoogleToDomain(
//   google: GoogleRestaurant | null,
//   discovery: DiscoveredRestaurant
// ): Partial<RestaurantWithIdentities> | null {
//   if (google) {
//     return {
//       name: google.displayName?.text ?? google.name ?? discovery.name,
//       latitude: google.location.latitude ?? discovery.latitude,
//       longitude: google.location.longitude ?? discovery.longitude,
//       address: google.formattedAddress,
//       rating: google.rating ? new Prisma.Decimal(google.rating) : null,
//       phoneNumber: google.internationalPhoneNumber,
//       priceRange: google.toPriceLevelAsNumber(),
//       tags: google.types,
//       openingHours: google?.toOsmOpeningHours() || discovery.openingHours, // TODO implement a converter from "weekdayDescriptions" to opening_hours
//       identities: [
//         { source: discovery.externalSource, externalId: discovery.externalId },
//         { source: "google_place_api", externalId: google.id }
//       ] as RestaurantIdentity[]
//     };
//   } else {
//     return null;
//   }
// }

// function identitiesFromPartial(restaurant: Partial<RestaurantWithIdentities>): RestaurantIdentity[] {
//   return restaurant?.identities || [];
// }

// function isSearchCandidate(obj: any): obj is SearchCandidate {
//   return obj && typeof obj.status === "string" && "restaurantId" in obj;
// }
