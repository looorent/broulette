import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaClient, SearchCandidateStatus } from "~/generated/prisma/client";

const prismaClientSingleton = () => {
  const prisma = new PrismaClient({
    accelerateUrl: process.env.DATABASE_URL!
  })
  .$extends({
    model: {
      search: {
        async findWithLatestCandidate(searchId: string) {
          return prisma.search.findUnique({
            where: {
              id: searchId,
            },
            include: {
              candidates: {
                select: {
                  id: true,
                  order: true
                },
                orderBy: {
                  order: "desc" as const,
                },
                where: {
                  status: SearchCandidateStatus.Returned,
                },
                take: 1
              },
            },
          });
        },

        async findUniqueWithRestaurantAndIdentities(searchId: string) {
          return await prisma.search.findUnique({
            where: { id: searchId },
            include: {
              candidates: {
                include: {
                  restaurant: { include: { identities: true } }
                }
              }
            }
          });
        }
      }
    }
  })
  .$extends(withAccelerate());
  return prisma;
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
