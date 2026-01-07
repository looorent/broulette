import { drizzle } from "drizzle-orm/d1";

import { CandidateRepositoryDrizzle, CandidateRepositoryPrisma, type CandidateRepository } from "./candidate-repository";
import { MatchingRepositoryDrizzle, MatchingRepositoryPrisma, type MatchingRepository } from "./matching-repository";
import { getPrisma } from "./prisma";
import { RestaurantRepositoryDrizzle, RestaurantRepositoryPrisma, type RestaurantRepository } from "./restaurant-repository";
import { SearchRepositoryDrizzle, SearchRepositoryPrisma, type SearchRepository } from "./search-repository";

export interface DatabaseRepositories {
  search: SearchRepository;
  candidate: CandidateRepository;
  restaurant: RestaurantRepository;
  matching: MatchingRepository;
}

export async function createPrismaRepositories(env: Env): Promise<DatabaseRepositories> {
  const prisma = await getPrisma(env);
  return {
    search: new SearchRepositoryPrisma(prisma),
    candidate: new CandidateRepositoryPrisma(prisma),
    restaurant: new RestaurantRepositoryPrisma(prisma),
    matching: new MatchingRepositoryPrisma(prisma)
  };
}

export async function createDrizzleRepositories(env: Env): Promise<DatabaseRepositories> {
  const database = drizzle(env.DB);
  return {
    search: new SearchRepositoryDrizzle(database),
    candidate: new CandidateRepositoryDrizzle(database),
    restaurant: new RestaurantRepositoryDrizzle(database),
    matching: new MatchingRepositoryDrizzle(database)
  };
}


