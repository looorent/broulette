

import { CandidateRepositoryDrizzle, type CandidateRepository } from "./candidate-repository";
import { getDrizzle } from "./drizzle";
import { MatchingRepositoryDrizzle, type MatchingRepository } from "./matching-repository";
import { RestaurantRepositoryDrizzle, type RestaurantRepository } from "./restaurant-repository";
import { SearchRepositoryDrizzle, type SearchRepository } from "./search-repository";

export interface DatabaseRepositories {
  search: SearchRepository;
  candidate: CandidateRepository;
  restaurant: RestaurantRepository;
  matching: MatchingRepository;
}

export async function createRepositories(env: Env): Promise<DatabaseRepositories> {
  const client = getDrizzle(env);
  return {
    search: new SearchRepositoryDrizzle(client),
    candidate: new CandidateRepositoryDrizzle(client),
    restaurant: new RestaurantRepositoryDrizzle(client),
    matching: new MatchingRepositoryDrizzle(client)
  };
}
