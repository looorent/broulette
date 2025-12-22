import prisma from "@features/db.server/prisma";
import { computeMonthBounds } from "@features/utils/date";

export async function countMatchingAttemptsDuringMonth(
  source: string,
  month: Date
): Promise<number> {
  const { start, end } = computeMonthBounds(month);

  return await prisma.restaurantMatchingAttempt.count({
    where: {
      source: source,
      attemptedAt: {
        gte: start,
        lt: end
      }
    }
  });
}

export async function hasReachedQuota(
  maxNumberOfAttemptsPerMonth: number,
  source: string
): Promise<boolean> {
  const numberOfAttemptsThisMonth = await countMatchingAttemptsDuringMonth(source, new Date());
  if (numberOfAttemptsThisMonth > maxNumberOfAttemptsPerMonth) {
    console.warn(`We have exceeded the monthly quota of ${source}: ${numberOfAttemptsThisMonth}/${maxNumberOfAttemptsPerMonth}`);
    return true;
  } else {
    return false;
  }
}
