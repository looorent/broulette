import { PrismaClient } from "@prisma/client/extension";
import { withAccelerate } from "@prisma/extension-accelerate";

const prismaClientSingleton = () => {
  return new PrismaClient({
    accelerateUrl: process.env.DATABASE_URL,
    log: ['query', 'info', 'warn', 'error'],
  })
    // .$extends({
    //   result: {
    //     search: {
    //       toUrl: {
    //         needs: { id: true },
    //         compute(search) {
    //           // Returns a function, creating a "method"
    //           return () => `/searches/${search.id}`;
    //         },
    //       },
    //       toNewSelectionUrl: {
    //         needs: { id: true },
    //         compute(search) {
    //           return () => `/searches/${search.id}/selections`;
    //         },
    //       },
    //     },
    //   },
    // })
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
