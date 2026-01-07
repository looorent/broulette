import type { DrizzleD1Database } from "drizzle-orm/d1";

import { createServiceDatetime, createServiceEnd } from "@features/search";
import type { DistanceRange, Prisma, PrismaClient, Search, SearchCandidateStatus, ServiceTimeslot } from "@persistence/client";

export type SearchAndRestaurantsAndProfiles = Prisma.SearchGetPayload<{
  include: {
    candidates: {
      include: {
        restaurant: {
          include: {
            profiles: true
          }
        }
      }
    }
  }
}>;

export interface SearchRepository {
  create(latitude: number,longitude: number,date: Date,timeslot: ServiceTimeslot,distanceRange: DistanceRange): Promise<Search>;
  findWithLatestCandidateId(searchId: string | undefined | null, candidateStatus?: SearchCandidateStatus | undefined): Promise<{
    searchId: string;
    exhausted: boolean;
    serviceTimeslot: ServiceTimeslot;
    serviceInstant: Date;
    order: number;
    distanceRange: DistanceRange;
    latestCandidateId: string | undefined;
  } | undefined>;
  findByIdWithRestaurantAndProfiles(searchId: string): Promise<SearchAndRestaurantsAndProfiles | null>;
  markSearchAsExhausted(searchId: string): Promise<void>;
}

export class SearchRepositoryPrisma implements SearchRepository {
  constructor(private readonly db: PrismaClient) { }

  async create(
    latitude: number,
    longitude: number,
    date: Date,
    timeslot: ServiceTimeslot,
    distanceRange: DistanceRange
  ): Promise<Search> {
    console.trace(`[Prisma] creating Search...`);
    return this.db.search.create({
      data: {
        latitude: latitude,
        longitude: longitude,
        serviceDate: date,
        serviceTimeslot: timeslot,
        serviceInstant: createServiceDatetime(date, timeslot),
        serviceEnd: createServiceEnd(date, timeslot),
        distanceRange: distanceRange,
        exhausted: false
      }
    });
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
  } | undefined> {
    if (searchId) {
      console.trace(`[Prisma] findWithLatestCandidateId: Querying searchId="${searchId}", status=${candidateStatus || "ALL"}`);
      const search = await this.db.search.findUnique({
        select: {
          id: true,
          exhausted: true,
          serviceTimeslot: true,
          serviceInstant: true,
          distanceRange: true,
          candidates: {
            select: { id: true, order: true },
            orderBy: { order: "desc" as const },
            where: {
              status: candidateStatus ?? undefined
            },
            take: 1
          }
        },
        where: {
          id: searchId
        }
      });

      if (search) {
        const latestId = search.candidates?.[0]?.id;
        console.trace(`[Prisma] findWithLatestCandidateId: Found search. Latest candidate: ${latestId ? latestId : "None"}`);
        return {
          searchId: search.id,
          exhausted: search.exhausted,
          serviceTimeslot: search.serviceTimeslot,
          serviceInstant: search.serviceInstant,
          distanceRange: search.distanceRange,
          latestCandidateId: latestId || undefined,
          order: search.candidates?.[0]?.order || 0
        };
      } else {
        console.trace(`[Prisma] findWithLatestCandidateId: Search "${searchId}" not found`);
        return undefined;
      }
    } else {
      return undefined;
    }
  }

  async findByIdWithRestaurantAndProfiles(searchId: string): Promise<SearchAndRestaurantsAndProfiles | null> {
    console.trace(`[Prisma] findUniqueWithRestaurantAndProfiles: Querying searchId="${searchId}"`);
    return this.db.search.findUnique({
      where: { id: searchId },
      include: {
        candidates: {
          include: { restaurant: { include: { profiles: true } } }
        }
      }
    });
  }

  async markSearchAsExhausted(searchId: string): Promise<void> {
    console.log(`[SearchEngine] Marking search "${searchId}" as EXHAUSTED.`);
    await this.db.search.update({
      data: { exhausted: true },
      where: { id: searchId }
    });
  }
}


export class SearchRepositoryDrizzle implements SearchRepository {
  constructor(private readonly db: DrizzleD1Database<Record<string, never>> & { $client: D1Database; }) { }

  async create(
    _latitude: number,
    _longitude: number,
    _date: Date,
    _timeslot: ServiceTimeslot,
    _distanceRange: DistanceRange
  ): Promise<Search> {
    throw new Error("not implemented");
  }

  async findWithLatestCandidateId(
    _searchId: string | undefined | null,
    _candidateStatus: SearchCandidateStatus | undefined = undefined
  ): Promise<{
    searchId: string;
    exhausted: boolean;
    serviceTimeslot: ServiceTimeslot;
    serviceInstant: Date;
    order: number;
    distanceRange: DistanceRange;
    latestCandidateId: string | undefined;
  } | undefined> {
    throw new Error("not implemented");
  }

  async findByIdWithRestaurantAndProfiles(_searchId: string): Promise<SearchAndRestaurantsAndProfiles | null> {
    throw new Error("not implemented");
  }

  async markSearchAsExhausted(_searchId: string): Promise<void> {
    throw new Error("not implemented");
  }
}
