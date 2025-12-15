import prisma from "@features/db.server/prisma";

export async function countMatchingAttemptsDuringMonth(source: string, month: Date): Promise<number> {
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const startOfNextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  return await prisma.restaurantMatchingAttempt.count({
    where: {
      source: source,
      attemptedAt: {
        gte: startOfMonth,
        lt: startOfNextMonth,
      }
    }
  });
}
