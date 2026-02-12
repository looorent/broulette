import { eq } from "drizzle-orm";

import { createServiceDatetime, createServiceEnd } from "@features/search";
import { logger } from "@features/utils/logger";

import type { DrizzleClient } from "./drizzle";
import type { DistanceRange, Search, SearchCandidateStatus, SearchWithCandidateContext, ServiceTimeslot } from "./drizzle.types";
import { searches } from "./schema";

export interface SearchRepository {
  create(latitude: number,longitude: number,date: Date,timeslot: ServiceTimeslot, distanceRange: DistanceRange, avoidFastFood: boolean, avoidTakeaway: boolean, minimumRating: number): Promise<Search>;
  findWithLatestCandidateId(searchId: string | undefined | null, candidateStatus?: SearchCandidateStatus | undefined): Promise<{
    searchId: string;
    exhausted: boolean;
    serviceTimeslot: ServiceTimeslot;
    serviceInstant: Date;
    order: number;
    distanceRange: DistanceRange;
    latestCandidateId: string | undefined;
    avoidFastFood: boolean;
    avoidTakeaway: boolean;
    minimumRating: number;
  } | undefined>;
  findByIdWithCandidateContext(searchId: string): Promise<SearchWithCandidateContext | undefined>;
  markSearchAsExhausted(searchId: string): Promise<void>;
}

export class SearchRepositoryDrizzle implements SearchRepository {
  constructor(private readonly db: DrizzleClient) { }

  async create(
    latitude: number,
    longitude: number,
    date: Date,
    timeslot: ServiceTimeslot,
    distanceRange: DistanceRange,
    avoidFastFood: boolean,
    avoidTakeaway: boolean,
    minimumRating: number
  ): Promise<Search> {
    logger.trace("[Drizzle] creating Search...");
    const [newSearch] = await this.db.insert(searches).values({
      latitude: latitude,
      longitude: longitude,
      serviceDate: date,
      serviceTimeslot: timeslot,
      serviceInstant: createServiceDatetime(date, timeslot),
      serviceEnd: createServiceEnd(date, timeslot),
      distanceRange: distanceRange,
      exhausted: false,
      avoidFastFood: avoidFastFood,
      avoidTakeaway: avoidTakeaway,
      minimumRating: minimumRating
    }).returning();
    return newSearch;
  }

  async findWithLatestCandidateId(
    searchId: string | undefined | null,
    candidateStatus: SearchCandidateStatus | undefined = undefined
  ): Promise<{
    searchId: string;
    exhausted: boolean;
    serviceTimeslot: ServiceTimeslot;
    serviceInstant: Date;
    order: number;
    distanceRange: DistanceRange;
    latestCandidateId: string | undefined;
    avoidFastFood: boolean;
    avoidTakeaway: boolean;
    minimumRating: number;
  } | undefined> {
    if (searchId) {
      const search = await this.db.query.searches.findFirst({
        where: eq(searches.id, searchId),
        columns: {
          id: true,
          exhausted: true,
          serviceTimeslot: true,
          serviceInstant: true,
          distanceRange: true,
          avoidFastFood: true,
          avoidTakeaway: true,
          minimumRating: true
        },
        with: {
          candidates: {
            columns: { id: true, order: true },
            orderBy: (candidates, { desc }) => [desc(candidates.order)],
            limit: 1,
            where: (candidates, { eq }) => candidateStatus ? eq(candidates.status, candidateStatus) : undefined
          }
        }
      });

      if (search) {
        const latestCandidate = search.candidates[0];
        const latestId = latestCandidate?.id;
        logger.trace("[Drizzle] findWithLatestCandidateId: Found search. Latest candidate: %s", latestId ? latestId : "None");
        return {
          searchId: search.id,
          exhausted: search.exhausted,
          serviceTimeslot: search.serviceTimeslot as ServiceTimeslot,
          serviceInstant: search.serviceInstant,
          distanceRange: search.distanceRange as DistanceRange,
          latestCandidateId: latestId,
          order: latestCandidate?.order ?? 0,
          avoidFastFood: search.avoidFastFood,
          avoidTakeaway: search.avoidTakeaway,
          minimumRating: search.minimumRating
        };
      } else {
        logger.trace("[Drizzle] findWithLatestCandidateId: Search '%s' not found", searchId);
        return undefined;
      }
    } else {
      return undefined;
    }
  }

  async findByIdWithCandidateContext(searchId: string): Promise<SearchWithCandidateContext | undefined> {
    logger.trace("[Drizzle] findByIdWithCandidateContext: Querying searchId='%s'", searchId);
    return this.db.query.searches.findFirst({
      where: eq(searches.id, searchId),
      with: {
        candidates: {
          columns: { order: true },
          with: {
            restaurant: {
              columns: {},
              with: {
                profiles: {
                  columns: { source: true, externalId: true, externalType: true }
                }
              }
            }
          }
        }
      }
    });
  }

  async markSearchAsExhausted(searchId: string): Promise<void> {
    logger.log("[Drizzle] Marking search '%s' as EXHAUSTED.", searchId);
    await this.db.update(searches)
      .set({ exhausted: true })
      .where(eq(searches.id, searchId));
  }
}
