import { and, asc, eq, notInArray, sql } from "drizzle-orm";

import type { DrizzleClient } from "./drizzle";
import { type CandidateAndRestaurantAndProfileAndSearch, type SearchCandidate, type SearchCandidateRejectionReason, type SearchCandidateStatus } from "./drizzle.types";
import { searchCandidates } from "./schema";

export interface CandidateRepository {
  findById(candidateId: string, searchId: string): Promise<CandidateAndRestaurantAndProfileAndSearch | undefined>;
  create(searchId: string, restaurantId: string | null | undefined, order: number, status: SearchCandidateStatus, rejectionReason?: SearchCandidateRejectionReason | null | undefined): Promise<SearchCandidate>;
  findBestRejectedCandidateThatCouldServeAsFallback(searchId: string): Promise<SearchCandidate | undefined>;
  recoverCandidate(fallbackCandidate: SearchCandidate, order: number): Promise<SearchCandidate>;
}

export class CandidateRepositoryDrizzle implements CandidateRepository {
  constructor(private readonly db: DrizzleClient) { }

  async findById(candidateId: string, searchId: string): Promise<CandidateAndRestaurantAndProfileAndSearch | undefined> {
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
    rejectionReason: SearchCandidateRejectionReason | null | undefined = undefined
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

  async findBestRejectedCandidateThatCouldServeAsFallback(searchId: string): Promise<SearchCandidate | undefined> {
    const returnedRestaurantsSubquery = this.db
      .select({ restaurantId: searchCandidates.restaurantId })
      .from(searchCandidates)
      .where(
        and(
          eq(searchCandidates.searchId, searchId),
          eq(searchCandidates.status, "Returned")
        )
      );

    const bestFallback = await this.db
      .select()
      .from(searchCandidates)
      .where(
        and(
          eq(searchCandidates.searchId, searchId),
          eq(searchCandidates.status, "Rejected"),
          notInArray(searchCandidates.restaurantId, returnedRestaurantsSubquery),
          sql`${searchCandidates.rejectionReason} IN ('no_image', 'unknown_opening_hours')`
        )
      )
      .orderBy(
        sql`CASE
            WHEN ${searchCandidates.rejectionReason} = 'no_image' THEN 1
            WHEN ${searchCandidates.rejectionReason} = 'unknown_opening_hours' THEN 2
            ELSE 3
          END`,
        asc(searchCandidates.order)
      )
      .limit(1);

    return bestFallback[0] ?? undefined;
  }

  async recoverCandidate(fallbackCandidate: SearchCandidate, order: number): Promise<SearchCandidate> {
    const [recovered] = await this.db.insert(searchCandidates)
      .values({
        searchId: fallbackCandidate.searchId,
        restaurantId: fallbackCandidate.restaurantId,
        order: order,
        status: "Returned",
        recoveredFromCandidateId: fallbackCandidate.id
    }).returning();
    return recovered;
  }
}
