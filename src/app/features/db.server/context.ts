import { CandidateRepositoryPrisma, type CandidateRepository } from "./candidate-repository";
import { MatchingRepositoryPrisma, type MatchingRepository } from "./matching-repository";
import { getPrisma } from "./prisma";
import { RestaurantRepositoryPrisma, type RestaurantRepository } from "./restaurant-repository";
import { SearchRepositoryPrisma, type SearchRepository } from "./search-repository";

export interface DatabaseRepositories {
  search: SearchRepository;
  candidate: CandidateRepository;
  restaurant: RestaurantRepository;
  matching: MatchingRepository;
}

export async function createRepositories(env: Env): Promise<DatabaseRepositories> {
  const prisma = await getPrisma(env);
  return {
    search: new SearchRepositoryPrisma(prisma),
    candidate: new CandidateRepositoryPrisma(prisma),
    restaurant: new RestaurantRepositoryPrisma(prisma),
    matching: new MatchingRepositoryPrisma(prisma)
  };
}
