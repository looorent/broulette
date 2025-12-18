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
