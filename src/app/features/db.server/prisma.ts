import { PrismaClient } from "@persistence/client";
import { SearchCandidateStatus } from "@persistence/enums";
import { withAccelerate } from "@prisma/extension-accelerate";

const prismaClientSingleton = () => {
  const prisma = new PrismaClient({
    accelerateUrl: process.env.BROULETTE_DATABASE_URL!
  })
  .$extends({
    model: {
      search: {
        async findWithLatestCandidateId(searchId: string) {
          return await prisma.search.findUnique({
            select: {
              id: true,
              exhausted: true,
              candidates: {
                select: { id: true, order: true },
                orderBy: { order: "desc" as const },
                where: { status: SearchCandidateStatus.Returned },
                take: 1
              }
            },
            where: {
              id: searchId
            }
          });
        },

        async findUniqueWithRestaurantAndProfiles(searchId: string) {
          return await prisma.search.findUnique({
            where: { id: searchId },
            include: {
              candidates: {
                include: { restaurant: { include: { profiles: true } } }
              }
            }
          });
        }
      },
      restaurantMatchingAttempt: {
        async existsSince(instant: Date, restaurantId: string, source: string) {
          const recentAttempt = await prisma.restaurantMatchingAttempt.findFirst({
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

          return !!recentAttempt;
        }
      }
    }
  })
  .$extends(withAccelerate());
  return prisma;
};

export type ExtendedPrismaClient = ReturnType<typeof prismaClientSingleton>;
const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

const prisma: ExtendedPrismaClient = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

// Only assign to global when NOT in production to prevent hot-reload conflicts
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
