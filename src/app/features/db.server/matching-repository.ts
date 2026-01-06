import { computeMonthBounds } from "@features/utils/date";
import type { PrismaClient, RestaurantMatchingAttempt } from "@persistence/client";

export interface MatchingRepository {
  doesAttemptExistsSince(instant: Date, restaurantId: string, source: string): Promise<boolean>;
  hasReachedQuota(source: string, maxNumberOfAttemptsPerMonth: number): Promise<boolean>;
  countMatchingAttemptsDuringMonth(source: string, month: Date): Promise<number>;
  registerAttemptToFindAMatch(query: string, queryType: string, source: string, restaurantId: string, found: boolean, latitude?: number, longitude?: number, radiusInMeter?: number): Promise<RestaurantMatchingAttempt>
}

export class MatchingRepositoryPrisma implements MatchingRepository {
  constructor(private readonly db: PrismaClient) {}

  async doesAttemptExistsSince(instant: Date, restaurantId: string, source: string): Promise<boolean> {
    console.trace(`[Prisma] doesAttemptExistsSince: Checking attempts for restaurant="${restaurantId}" from source="${source}" since ${instant.toISOString()}`);
    const recentAttempt = await this.db.restaurantMatchingAttempt.findFirst({
      where: {
        restaurantId: restaurantId,
        source: source,
        attemptedAt: {
          gte: instant,
        },
      },
      select: {
        id: true
      }
    });

    const exists = !!recentAttempt;
    console.trace(`[Prisma] doesAttemptExistsSince: Result = ${exists}`);
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

  countMatchingAttemptsDuringMonth(source: string, month: Date): Promise<number> {
    const { start, end } = computeMonthBounds(month);
    return this.db.restaurantMatchingAttempt.count({
      where: {
        source: source,
        attemptedAt: {
          gte: start,
          lt: end
        }
      }
    });
  }

  registerAttemptToFindAMatch(
    query: string,
    queryType: string,
    source: string,
    restaurantId: string,
    found: boolean,
    latitude: number | undefined = undefined,
    longitude: number | undefined = undefined,
    radiusInMeter: number | undefined = undefined
  ): Promise<RestaurantMatchingAttempt> {
    return this.db.restaurantMatchingAttempt.create({
      data: {
        queryType: queryType,
        source: source,
        found: found,
        restaurantId: restaurantId,
        query: query,
        latitude: latitude,
        longitude: longitude,
        radius: radiusInMeter
      }
    });
  }
}
