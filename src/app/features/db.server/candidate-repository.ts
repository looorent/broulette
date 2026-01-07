import { and, eq } from "drizzle-orm";

import type { DrizzleClient } from "./drizzle";
import type { CandidateAndRestaurantAndProfileAndSearch, SearchCandidate, SearchCandidateStatus } from "./drizzle.types";
import { searchCandidates } from "./schema";

export interface CandidateRepository {
  findById(candidateId: string, searchId: string): Promise<CandidateAndRestaurantAndProfileAndSearch | undefined>;
  create(searchId: string, restaurantId: string | null | undefined, order: number, status: SearchCandidateStatus, rejectionReason?: string | null | undefined): Promise<SearchCandidate>;
}

export class CandidateRepositoryDrizzle implements CandidateRepository {
  constructor(private readonly db: DrizzleClient) { }

  async findById(candidateId: string,searchId: string): Promise<CandidateAndRestaurantAndProfileAndSearch | undefined> {
    return this.db.query.searchCandidates.findFirst({
      where: and(
        eq(searchCandidates.id, candidateId),
        eq(searchCandidates.searchId, searchId)
      ),
      with: {
        search: true,
        restaurant: {
          with: {
            profiles: true
          }
        }
      }
    });
  }

  async create(
    searchId: string,
    restaurantId: string | null | undefined,
    order: number,
    status: SearchCandidateStatus,
    rejectionReason: string | null | undefined = undefined
  ): Promise<SearchCandidate> {
    const [candidate] = await this.db.insert(searchCandidates)
      .values({
        searchId,
        restaurantId: restaurantId ?? null,
        order,
        status,
        rejectionReason: rejectionReason ?? null
      })
      .returning();
    return candidate;
  }
}
