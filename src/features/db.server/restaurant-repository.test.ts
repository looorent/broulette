import { pushSQLiteSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { beforeEach, describe, expect, it } from "vitest";

import type { DrizzleClient } from "./drizzle";
import { RestaurantRepositoryDrizzle } from "./restaurant-repository";
import * as schema from "./schema";
async function createDatabaseWithSchema() {
  const db = drizzle(":memory:", { schema });
  const { statementsToExecute } = await pushSQLiteSchema(schema, db as never);
  statementsToExecute.forEach(statement => db.$client.exec(statement));
  return db;
}

const viewport = {
  bottomLeft: { latitude: 50.84, longitude: 4.34 },
  topRight: { latitude: 50.86, longitude: 4.36 }
};

describe("RestaurantRepositoryDrizzle.findProfilesWithin", () => {
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let repository: RestaurantRepositoryDrizzle;

  beforeEach(async () => {
    db = await createDatabaseWithSchema();
    repository = new RestaurantRepositoryDrizzle(db as unknown as DrizzleClient);
  });

  function insertRestaurant(id: string, latitude: number, longitude: number, sources: string[]) {
    db.insert(schema.restaurants).values({ id, name: id, latitude, longitude }).run();
    for (const source of sources) {
      db.insert(schema.restaurantProfiles).values({
        restaurantId: id,
        source,
        externalId: `${source}-${id}`,
        externalType: "node",
        latitude,
        longitude,
        name: id
      }).run();
    }
  }

  it("returns the profiles of the requested source for restaurants inside the viewport", async () => {
    insertRestaurant("inside", 50.85, 4.35, ["osm", "google_place"]);
    insertRestaurant("outside", 50.90, 4.35, ["osm"]);

    const profiles = await repository.findProfilesWithin(viewport, "osm", 10);

    expect(profiles.map(profile => profile.externalId)).toEqual(["osm-inside"]);
  });

  it("returns at most the requested number of profiles", async () => {
    insertRestaurant("first", 50.85, 4.35, ["osm"]);
    insertRestaurant("second", 50.851, 4.351, ["osm"]);

    const profiles = await repository.findProfilesWithin(viewport, "osm", 1);

    expect(profiles).toHaveLength(1);
  });
});
