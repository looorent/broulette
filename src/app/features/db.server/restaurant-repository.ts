import { eq, exists } from "drizzle-orm";

import type { DiscoveredRestaurantProfile } from "@features/discovery.server";

import type { DrizzleClient } from "./drizzle";
import type { RestaurantAndProfiles, RestaurantProfilePayload } from "./drizzle.types";
import { restaurantProfiles, restaurants } from "./schema";

export interface RestaurantRepository {
  createProfile(profile: RestaurantProfilePayload, restaurant: RestaurantAndProfiles): Promise<RestaurantAndProfiles>;
  updateProfile(profileId: string, profile: RestaurantProfilePayload, restaurant: RestaurantAndProfiles): Promise<RestaurantAndProfiles>;
  findRestaurantWithExternalIdentity(externalId: string, externalType: string, source: string): Promise<RestaurantAndProfiles | undefined>;
  createRestaurantFromDiscovery(discovered: DiscoveredRestaurantProfile, tags: string[]): Promise<RestaurantAndProfiles>;
}

export class RestaurantRepositoryDrizzle implements RestaurantRepository {
  constructor(private readonly db: DrizzleClient) { }

  async createProfile(profile: RestaurantProfilePayload, restaurant: RestaurantAndProfiles): Promise<RestaurantAndProfiles> {
    console.trace(`[Drizzle] Creating new profile for restaurant ${restaurant.id}`);
    const { id, createdAt, ...dataToInsert } = profile;
    const [newProfile] = await this.db.insert(restaurantProfiles)
      .values(dataToInsert)
      .returning();

    return {
      ...restaurant,
      profiles: [...restaurant.profiles, newProfile]
    };
  }

  async updateProfile(profileId: string, profile: RestaurantProfilePayload, restaurant: RestaurantAndProfiles): Promise<RestaurantAndProfiles> {
    console.trace(`[Drizzle] Updating profile ${profileId}`);
    const { id, createdAt, restaurantId, ...dataToUpdate } = profile;
    const [updatedProfile] = await this.db.update(restaurantProfiles)
      .set(dataToUpdate)
      .where(eq(restaurantProfiles.id, profileId))
      .returning();

    if (updatedProfile) {
      return {
        ...restaurant,
        profiles: restaurant.profiles.map(p => p.id === updatedProfile.id ? updatedProfile : p)
      };
    } else {
      throw new Error(`Profile with id ${profileId} not found`);
    }
  }

  findRestaurantWithExternalIdentity(externalId: string, externalType: string, source: string): Promise<RestaurantAndProfiles | undefined> {
    return this.db.query.restaurants.findFirst({
      where: (r, { eq, and }) => exists(
        this.db.select()
          .from(restaurantProfiles)
          .where(and(
            eq(restaurantProfiles.restaurantId, r.id),
            eq(restaurantProfiles.externalId, externalId),
            eq(restaurantProfiles.externalType, externalType),
            eq(restaurantProfiles.source, source)
          ))
      ),
      with: {
        profiles: true
      }
    });
  }

  createRestaurantFromDiscovery(discovered: DiscoveredRestaurantProfile, tags: string[]): Promise<RestaurantAndProfiles> {
    return this.db.transaction(async (tx) => {
      const [newRestaurant] = await tx.insert(restaurants)
        .values({
          name: discovered.name || null,
          latitude: discovered.latitude,
          longitude: discovered.longitude,
        })
        .returning();

      const [newProfile] = await tx.insert(restaurantProfiles)
        .values({
          ...discovered,
          restaurantId: newRestaurant.id,
          version: 1,
          tags: tags
        })
        .returning();

      return {
        ...newRestaurant,
        profiles: [newProfile]
      };
    });
  }
}
