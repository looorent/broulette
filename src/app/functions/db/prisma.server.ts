import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaClient } from "~/generated/prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient({
    accelerateUrl: process.env.DATABASE_URL!
  })
  .$extends({
    result: {
      search: {
        toUrl: {
          needs: { id: true },
          compute(search) {
            return () => `/searches/${search.id}`;
          },
        },
        toNewCandidateUrl: {
          needs: { id: true },
          compute(search) {
            return () => `/searches/${search.id}/candidates`;
          },
        },
      },
      candidate: {
        toUrl: {
          needs: {
            id: true,
            searchId: true
          },
          compute(candidate) {
            return () => `/searches/${candidate.searchId}/candidates/${candidate.id}`;
          },
        }
      }
    }
  })
  .$extends(withAccelerate());
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
