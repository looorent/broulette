import { withAccelerate } from "@prisma/extension-accelerate";

import { DistanceRange, PrismaClient, SearchCandidateStatus, ServiceTimeslot } from "@persistence/client";

interface Env {
  BROULETTE_DATABASE_URL: string;
}

function createPrismaClient(databaseUrl: string) {
  const prisma = new PrismaClient({
    accelerateUrl: databaseUrl
  })
  .$extends({
    model: {
      search: {
        async findWithLatestCandidateId(
          searchId: string | undefined | null,
          candidateStatus: SearchCandidateStatus | undefined = undefined
        ): Promise<{
          searchId: string;
          exhausted: boolean;
          serviceTimeslot: ServiceTimeslot;
          serviceInstant: Date;
          order: number;
          distanceRange: DistanceRange;
          latestCandidateId: string | undefined;
        } | undefined> {
          if (searchId) {
            const search = await prisma.search.findUnique({
              select: {
                id: true,
                exhausted: true,
                serviceTimeslot: true,
                serviceInstant: true,
                distanceRange: true,
                candidates: {
                  select: { id: true, order: true },
                  orderBy: { order: "desc" as const },
                  where: {
                    status: candidateStatus ?? undefined
                  },
                  take: 1
                }
              },
              where: {
                id: searchId
              }
            });

            if (search) {
              return {
                searchId: search.id,
                exhausted: search.exhausted,
                serviceTimeslot: search.serviceTimeslot,
                serviceInstant: search.serviceInstant,
                distanceRange: search.distanceRange,
                latestCandidateId: search.candidates?.[0]?.id || undefined,
                order: search.candidates?.[0]?.order || 0
              };
            } else {
              return undefined;
            }
          } else {
            return undefined;
          }
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

export type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

export function getPrisma(env: Env): ExtendedPrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient(env.BROULETTE_DATABASE_URL);
  }
  return globalForPrisma.prisma;
};
