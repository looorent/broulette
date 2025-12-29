import { withAccelerate } from "@prisma/extension-accelerate";

import { PrismaClient } from "@persistence/client";
import type { DistanceRange, SearchCandidateStatus, ServiceTimeslot } from "@persistence/enums";

interface Env {
  BROULETTE_DATABASE_URL: string;
}

function createPrismaClient(databaseUrl: string) {
  console.log("[Prisma] Initializing new PrismaClient instance");
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
              console.trace(`[Prisma] findWithLatestCandidateId: Querying searchId="${searchId}", status=${candidateStatus || "ALL"}`);
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
                const latestId = search.candidates?.[0]?.id;
                console.trace(`[Prisma] findWithLatestCandidateId: Found search. Latest candidate: ${latestId ? latestId : "None"}`);
                return {
                  searchId: search.id,
                  exhausted: search.exhausted,
                  serviceTimeslot: search.serviceTimeslot,
                  serviceInstant: search.serviceInstant,
                  distanceRange: search.distanceRange,
                  latestCandidateId: latestId || undefined,
                  order: search.candidates?.[0]?.order || 0
                };
              } else {
                console.trace(`[Prisma] findWithLatestCandidateId: Search "${searchId}" not found`);
                return undefined;
              }
            } else {
              return undefined;
            }
          },

          async findUniqueWithRestaurantAndProfiles(searchId: string) {
            console.trace(`[Prisma] findUniqueWithRestaurantAndProfiles: Querying searchId="${searchId}"`);
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
            console.trace(`[Prisma] existsSince: Checking attempts for restaurant="${restaurantId}" from source="${source}" since ${instant.toISOString()}`);
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

            const exists = !!recentAttempt;
            console.trace(`[Prisma] existsSince: Result = ${exists}`);
            return exists;
          }
        }
      }
    })
    .$extends(withAccelerate());
  console.log("[Prisma] Initializing new PrismaClient instance: done.");
  return prisma;
};

export type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

export async function getPrisma(env: Env): Promise<ExtendedPrismaClient> {
  if (!globalForPrisma.prisma) {
    console.log("[Prisma] Global instance not found. Creating new client...");
    globalForPrisma.prisma = createPrismaClient(env.BROULETTE_DATABASE_URL);
  } else {
    console.trace("[Prisma] Reusing existing global client instance");
  }
  return globalForPrisma.prisma;
};
