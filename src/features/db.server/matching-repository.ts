import { and, count, eq, gte, lt } from "drizzle-orm";

import { computeMonthBounds } from "@features/utils/date";

import type { DrizzleClient } from "./drizzle";
import type { RestaurantMatchingAttempt } from "./drizzle.types";
import { restaurantMatchingAttempts } from "./schema";


export interface MatchingRepository {
  doesAttemptExistsSince(instant: Date, restaurantId: string, source: string): Promise<boolean>;
  hasReachedQuota(source: string, maxNumberOfAttemptsPerMonth: number): Promise<boolean>;
  countMatchingAttemptsDuringMonth(source: string, month: Date): Promise<number>;
  registerAttemptToFindAMatch(query: string, queryType: string, source: string, restaurantId: string, found: boolean, latitude?: number, longitude?: number, radiusInMeter?: number): Promise<RestaurantMatchingAttempt>
}

export class MatchingRepositoryDrizzle implements MatchingRepository {
  constructor(private readonly db: DrizzleClient) { }

  async doesAttemptExistsSince(
    instant: Date,
    restaurantId: string,
    source: string
  ): Promise<boolean> {
    console.trace(`[Drizzle] doesAttemptExistsSince: Checking attempts for restaurant="${restaurantId}" from source="${source}" since ${instant.toISOString()}`);
    const recentAttempt = await this.db.query.restaurantMatchingAttempts.findFirst({
      where: and(
        eq(restaurantMatchingAttempts.restaurantId, restaurantId),
        eq(restaurantMatchingAttempts.source, source),
        gte(restaurantMatchingAttempts.attemptedAt, instant)
      ),
      columns: {
        id: true
      }
    });

    const exists = !!recentAttempt;
    console.trace(`[Drizzle] doesAttemptExistsSince: Result = ${exists}`);
    return exists;
  }

  async hasReachedQuota(source: string, maxNumberOfAttemptsPerMonth: number): Promise<boolean> {
    const numberOfAttemptsThisMonth = await this.countMatchingAttemptsDuringMonth(source, new Date());
    if (numberOfAttemptsThisMonth > maxNumberOfAttemptsPerMonth) {
      console.warn(`We have exceeded the monthly quota of ${source}: ${numberOfAttemptsThisMonth}/${maxNumberOfAttemptsPerMonth}`);
      return true;
    } else {
      return false;
    }
  }

  async countMatchingAttemptsDuringMonth(source: string, month: Date): Promise<number> {
    const { start, end } = computeMonthBounds(month);

    const [result] = await this.db
      .select({ count: count() })
      .from(restaurantMatchingAttempts)
      .where(and(
        eq(restaurantMatchingAttempts.source, source),
        gte(restaurantMatchingAttempts.attemptedAt, start),
        lt(restaurantMatchingAttempts.attemptedAt, end)
      ));

    return result.count;
  }

  async registerAttemptToFindAMatch(
    query: string,
    queryType: string,
    source: string,
    restaurantId: string,
    found: boolean,
    latitude: number | undefined = undefined,
    longitude: number | undefined = undefined,
    radiusInMeter: number | undefined = undefined
  ): Promise<RestaurantMatchingAttempt> {
    const [attempt] = await this.db.insert(restaurantMatchingAttempts)
      .values({
        queryType,
        source,
        found,
        restaurantId,
        query,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        radius: radiusInMeter ?? null
      })
      .returning();
    return attempt;
  }
}
