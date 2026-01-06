import { PrismaPostgresAdapter } from "@prisma/adapter-ppg";

import { PrismaClient } from "@persistence/client";
interface Env {
  BROULETTE_DATABASE_URL: string;
}

function createPrismaClient(databaseUrl: string): PrismaClient {
  console.log("[Prisma] Initializing new PrismaClient instance");
  const prisma =new PrismaClient({
    adapter: new PrismaPostgresAdapter({
      connectionString: databaseUrl
    })
  });
  console.log("[Prisma] Initializing new PrismaClient instance: done.");
  return prisma;
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export async function getPrisma(env: Env): Promise<PrismaClient> {
  if (!globalForPrisma.prisma) {
    console.log("[Prisma] Global instance not found. Creating new client...");
    globalForPrisma.prisma = createPrismaClient(env.BROULETTE_DATABASE_URL);
  } else {
    console.trace("[Prisma] Reusing existing global client instance");
  }
  return globalForPrisma.prisma;
};
