import { PrismaClient } from "@persistence/client";
import { SearchCandidateStatus } from "@persistence/enums";
import { withAccelerate } from "@prisma/extension-accelerate";

const prismaClientSingleton = () => {
  const prisma = new PrismaClient({
    accelerateUrl: import.meta.env.VITE_DATABASE_URL!
  })
  .$extends({
    model: {
      search: {
        async findWithLatestCandidate(this: any, searchId: string) {
          return await prisma.search.findUnique({
            where: { id: searchId },
            include: {
              candidates: {
                select: { id: true, order: true },
                orderBy: { order: "desc" as const },
                where: { status: SearchCandidateStatus.Returned },
                take: 1
              },
            },
          });
        },

        async findUniqueWithRestaurantAndIdentities(this: any, searchId: string) {
          return await prisma.search.findUnique({
            where: { id: searchId },
            include: {
              candidates: {
                include: { restaurant: { include: { identities: true } } }
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
