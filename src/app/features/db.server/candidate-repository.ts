import { SearchCandidateStatus, type Prisma, type PrismaClient, type SearchCandidate } from "@persistence/client";

export interface CandidateRepository {
  findById(candidateId: string, searchId: string): Promise<CandidateAndRestaurantAndProfileAndSearch | null>;
  create(searchId: string, restaurantId: string | null | undefined, order: number, status: SearchCandidateStatus, rejectionReason?: string | null | undefined): Promise<SearchCandidate>;
}

export type CandidateAndRestaurantAndProfileAndSearch = Prisma.SearchCandidateGetPayload<{
  include: {
    search: true,
    restaurant: {
      include: {
        profiles: true
      }
    }
  }
}>;

export class CandidateRepositoryPrisma implements CandidateRepository {
  constructor(private readonly db: PrismaClient) { }

  async findById(candidateId: string, searchId: string): Promise<CandidateAndRestaurantAndProfileAndSearch | null> {
    return await this.db.searchCandidate.findUnique({
      where: {
        id: candidateId,
        searchId: searchId
      },
      include: {
        search: true,
        restaurant: { include: { profiles: true } }
      }
    });
  }

  create(searchId: string, restaurantId: string | null | undefined, order: number, status: SearchCandidateStatus, rejectionReason: string | null | undefined = undefined): Promise<SearchCandidate> {
    return this.db.searchCandidate.create({
      data: {
        searchId: searchId,
        restaurantId: restaurantId,
        order: order,
        status: status,
        rejectionReason: rejectionReason
      }
    });
  }
}
