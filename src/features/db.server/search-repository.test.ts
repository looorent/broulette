import { describe, expect, it, vi } from "vitest";

import { createMockDb } from "./database-mock";
import { SearchRepositoryDrizzle } from "./search-repository";

describe("SearchRepositoryDrizzle", () => {
  describe("create", () => {
    it("creates a new search with correct values", async () => {
      const mockDb = createMockDb();
      const newSearch = {
        id: "search-1",
        latitude: 48.8566,
        longitude: 2.3522,
        serviceDate: new Date(2024, 2, 15),
        serviceTimeslot: "Lunch",
        distanceRange: "MidRange",
        serviceInstant: new Date(2024, 2, 15, 12, 30),
        serviceEnd: new Date(2024, 2, 15, 14, 30),
        exhausted: false,
        createdAt: new Date()
      };

      vi.mocked(mockDb.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newSearch])
        })
      } as unknown as ReturnType<typeof mockDb.insert>);

      const repository = new SearchRepositoryDrizzle(mockDb);

      const result = await repository.create(
        48.8566,
        2.3522,
        new Date(2024, 2, 15),
        "Lunch",
        "MidRange",
        true,
        true,
        0
      );

      expect(result).toEqual(newSearch);
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe("findWithLatestCandidateId", () => {
    it("returns undefined for null searchId", async () => {
      const mockDb = createMockDb();
      const repository = new SearchRepositoryDrizzle(mockDb);

      const result = await repository.findWithLatestCandidateId(null);

      expect(result).toBeUndefined();
    });

    it("returns undefined for undefined searchId", async () => {
      const mockDb = createMockDb();
      const repository = new SearchRepositoryDrizzle(mockDb);

      const result = await repository.findWithLatestCandidateId(undefined);

      expect(result).toBeUndefined();
    });

    it("returns undefined when search is not found", async () => {
      const mockDb = createMockDb();
      vi.mocked(mockDb.query.searches.findFirst).mockResolvedValue(undefined);
      const repository = new SearchRepositoryDrizzle(mockDb);

      const result = await repository.findWithLatestCandidateId("non-existent");

      expect(result).toBeUndefined();
    });

    it("returns search with latest candidate id when found", async () => {
      const mockDb = createMockDb();
      const mockSearch = {
        id: "search-1",
        exhausted: false,
        serviceTimeslot: "Lunch" as const,
        serviceInstant: new Date(2024, 2, 15, 12, 30),
        distanceRange: "MidRange" as const,
        candidates: [
          { id: "candidate-1", order: 1 }
        ],
        createdAt: new Date(),
        latitude: 48.8566,
        longitude: 2.3522,
        serviceDate: new Date(2024, 2, 15),
        serviceEnd: new Date(2024, 2, 15, 14, 30),
        avoidFastFood: true,
        avoidTakeaway: true,
        minimumRating: 0,
      };
      vi.mocked(mockDb.query.searches.findFirst).mockResolvedValue(mockSearch);
      const repository = new SearchRepositoryDrizzle(mockDb);

      const result = await repository.findWithLatestCandidateId("search-1");

      expect(result).toBeDefined();
      expect(result!.searchId).toBe("search-1");
      expect(result!.latestCandidateId).toBe("candidate-1");
      expect(result!.order).toBe(1);
    });

    it("returns search with undefined latestCandidateId when no candidates", async () => {
      const mockDb = createMockDb();
      const mockSearch = {
        id: "search-1",
        exhausted: false,
        serviceTimeslot: "Lunch" as const,
        serviceInstant: new Date(2024, 2, 15, 12, 30),
        distanceRange: "MidRange" as const,
        candidates: [],
        createdAt: new Date(),
        latitude: 48.8566,
        longitude: 2.3522,
        serviceDate: new Date(2024, 2, 15),
        serviceEnd: new Date(2024, 2, 15, 14, 30),
        avoidFastFood: true,
        avoidTakeaway: true,
        minimumRating: 0,
      };
      vi.mocked(mockDb.query.searches.findFirst).mockResolvedValue(mockSearch);
      const repository = new SearchRepositoryDrizzle(mockDb);

      const result = await repository.findWithLatestCandidateId("search-1");

      expect(result).toBeDefined();
      expect(result!.latestCandidateId).toBeUndefined();
      expect(result!.order).toBe(0);
    });
  });

  describe("findByIdWithCandidateContext", () => {
    it("returns search with candidate context", async () => {
      const mockDb = createMockDb();
      const mockSearch = {
        id: "search-1",
        exhausted: false,
        candidates: [
          {
            order: 1,
            restaurant: {
              profiles: [{ source: "google_place", externalId: "ext-1", externalType: "place" }]
            }
          }
        ],
        createdAt: new Date(),
        latitude: 48.8566,
        longitude: 2.3522,
        serviceDate: new Date(2024, 2, 15),
        serviceEnd: new Date(2024, 2, 15, 14, 30),
        serviceTimeslot: "Lunch" as const,
        serviceInstant: new Date(2024, 2, 15, 12, 30),
        distanceRange: "MidRange" as const,
        avoidFastFood: true,
        avoidTakeaway: true,
        minimumRating: 0,
      };
      vi.mocked(mockDb.query.searches.findFirst).mockResolvedValue(mockSearch);
      const repository = new SearchRepositoryDrizzle(mockDb);

      const result = await repository.findByIdWithCandidateContext("search-1");

      expect(result).toBeDefined();
      expect(result!.id).toBe("search-1");
      expect(result!.candidates).toHaveLength(1);
    });

    it("returns undefined when search not found", async () => {
      const mockDb = createMockDb();
      vi.mocked(mockDb.query.searches.findFirst).mockResolvedValue(undefined);
      const repository = new SearchRepositoryDrizzle(mockDb);

      const result = await repository.findByIdWithCandidateContext("non-existent");

      expect(result).toBeUndefined();
    });
  });

  describe("markSearchAsExhausted", () => {
    it("updates search exhausted flag to true", async () => {
      const mockDb = createMockDb();
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined)
        })
      });
      (mockDb.update as ReturnType<typeof vi.fn>) = mockUpdate;
      const repository = new SearchRepositoryDrizzle(mockDb);

      await repository.markSearchAsExhausted("search-1");

      expect(mockUpdate).toHaveBeenCalled();
    });
  });
});
