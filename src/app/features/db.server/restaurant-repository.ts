import type { DrizzleD1Database } from "drizzle-orm/d1";

import type { DiscoveredRestaurantProfile } from "@features/discovery.server";
import { Prisma, type PrismaClient } from "@persistence/client";

export type RestaurantAndProfiles = Prisma.RestaurantGetPayload<{
  include: {
    profiles: true;
  }
}>;

export type RestaurantProfilePayload = Prisma.XOR<Prisma.RestaurantProfileCreateInput, Prisma.RestaurantProfileUncheckedCreateInput>;

export interface RestaurantRepository {
  createProfile(profile: RestaurantProfilePayload, restaurant: RestaurantAndProfiles): Promise<RestaurantAndProfiles>;
  updateProfile(profileId: string, profile: RestaurantProfilePayload, restaurant: RestaurantAndProfiles): Promise<RestaurantAndProfiles>;
  findRestaurantWithExternalIdentity(externalId: string, externalType: string, source: string): Promise<RestaurantAndProfiles | null>;
  createRestaurantFromDiscovery(discovered: DiscoveredRestaurantProfile, tags: string[]): Promise<RestaurantAndProfiles>;
}

export class RestaurantRepositoryPrisma implements RestaurantRepository {
  constructor(private readonly db: PrismaClient) {}

  async createProfile(profile: RestaurantProfilePayload, restaurant: RestaurantAndProfiles): Promise<RestaurantAndProfiles> {
    const newProfile = await this.db.restaurantProfile.create({
      data: profile
    });
    return {
      ...restaurant,
      profiles: [...restaurant.profiles, newProfile]
    };
  }

  async updateProfile(profileId: string, profile: RestaurantProfilePayload, restaurant: RestaurantAndProfiles): Promise<RestaurantAndProfiles> {
    const updatedProfile = await this.db.restaurantProfile.update({
      data: profile,
      where: { id: profileId }
    });

    return {
      ...restaurant,
      profiles: restaurant.profiles.map(profile => profile.id === updatedProfile.id ? updatedProfile : profile)
    };
  }

  findRestaurantWithExternalIdentity(externalId: string, externalType: string, source: string): Promise<RestaurantAndProfiles | null> {
    return this.db.restaurant.findFirst({
      where: {
        profiles: {
          some: {
            externalId: externalId,
            externalType: externalType,
            source: source
          }
        }
      },
      include: {
        profiles: true
      }
    });
  }

  createRestaurantFromDiscovery(discovered: DiscoveredRestaurantProfile, tags: string[]): Promise<RestaurantAndProfiles> {
    return this.db.restaurant.create({
      data: {
        name: discovered.name || null,
        latitude: discovered.latitude,
        longitude: discovered.longitude,
        profiles: {
          create: {
            ...discovered,
            version: 1,
            tags: tags
          }
        }
      },
      include: {
        profiles: true
      }
    });
  }
}

export class RestaurantRepositoryDrizzle implements RestaurantRepository {
  constructor(private readonly db: DrizzleD1Database<Record<string, never>> & { $client: D1Database; }) { }

  async createProfile(_profile: RestaurantProfilePayload, _restaurant: RestaurantAndProfiles): Promise<RestaurantAndProfiles> {
    throw new Error("not implemented");
  }

  async updateProfile(_profileId: string, _profile: RestaurantProfilePayload, _restaurant: RestaurantAndProfiles): Promise<RestaurantAndProfiles> {
    throw new Error("not implemented");
  }

  findRestaurantWithExternalIdentity(_externalId: string, _externalType: string, _source: string): Promise<RestaurantAndProfiles | null> {
    throw new Error("not implemented");
  }

  createRestaurantFromDiscovery(_discovered: DiscoveredRestaurantProfile, _tags: string[]): Promise<RestaurantAndProfiles> {
    throw new Error("not implemented");
  }
}
