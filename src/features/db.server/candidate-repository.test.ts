import { describe, expect, it, vi } from "vitest";

import { CandidateRepositoryDrizzle } from "./candidate-repository";
import { createMockDb } from "./database-mock";
import type { SearchCandidate } from "./drizzle.types";

describe("CandidateRepositoryDrizzle", () => {
  describe("findById", () => {
    it("returns candidate when found", async () => {
      const mockDb = createMockDb();
      const mockCandidate = {
        id: "candidate-1",
        createdAt: new Date(),
        searchId: "search-1",
        restaurantId: "restaurant-1",
        recoveredFromCandidateId: null,
        order: 1,
        status: "Returned" as const,
        rejectionReason: null,
        search: { id: "search-1" },
        restaurant: {
          id: "restaurant-1",
          profiles: []
        }
      };
      vi.mocked(mockDb.query.searchCandidates.findFirst).mockResolvedValue(mockCandidate);
      const repository = new CandidateRepositoryDrizzle(mockDb);

      const result = await repository.findById("candidate-1", "search-1");

      expect(result).toEqual(mockCandidate);
    });

    it("returns undefined when candidate not found", async () => {
      const mockDb = createMockDb();
      vi.mocked(mockDb.query.searchCandidates.findFirst).mockResolvedValue(undefined);
      const repository = new CandidateRepositoryDrizzle(mockDb);

      const result = await repository.findById("non-existent", "search-1");

      expect(result).toBeUndefined();
    });
  });

  describe("create", () => {
    it("creates a new candidate with Returned status", async () => {
      const mockDb = createMockDb();
      const newCandidate = {
        id: "candidate-1",
        searchId: "search-1",
        restaurantId: "restaurant-1",
        order: 1,
        status: "Returned",
        rejectionReason: null,
        createdAt: new Date(),
        recoveredFromCandidateId: null
      };

      vi.mocked(mockDb.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newCandidate])
        })
      } as unknown as ReturnType<typeof mockDb.insert>);

      const repository = new CandidateRepositoryDrizzle(mockDb);

      const result = await repository.create("search-1", "restaurant-1", 1, "Returned");

      expect(result).toEqual(newCandidate);
    });

    it("creates a rejected candidate with reason", async () => {
      const mockDb = createMockDb();
      const newCandidate = {
        id: "candidate-1",
        searchId: "search-1",
        restaurantId: "restaurant-1",
        order: 1,
        status: "Rejected",
        rejectionReason: "closed",
        createdAt: new Date(),
        recoveredFromCandidateId: null
      };

      vi.mocked(mockDb.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newCandidate])
        })
      } as unknown as ReturnType<typeof mockDb.insert>);

      const repository = new CandidateRepositoryDrizzle(mockDb);

      const result = await repository.create("search-1", "restaurant-1", 1, "Rejected", "closed");

      expect(result).toEqual(newCandidate);
      expect(result.rejectionReason).toBe("closed");
    });

    it("creates a candidate without restaurantId", async () => {
      const mockDb = createMockDb();
      const newCandidate = {
        id: "candidate-1",
        searchId: "search-1",
        restaurantId: null,
        order: 1,
        status: "Rejected",
        rejectionReason: "no_restaurant_found",
        createdAt: new Date(),
        recoveredFromCandidateId: null
      };

      vi.mocked(mockDb.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newCandidate])
        })
      } as unknown as ReturnType<typeof mockDb.insert>);

      const repository = new CandidateRepositoryDrizzle(mockDb);

      const result = await repository.create("search-1", null, 1, "Rejected", "no_restaurant_found");

      expect(result.restaurantId).toBeNull();
    });
  });

  describe("findBestRejectedCandidateThatCouldServeAsFallback", () => {
    it("returns best fallback candidate when found", async () => {
      const mockDb = createMockDb();
      const mockFallback = {
        id: "candidate-1",
        searchId: "search-1",
        restaurantId: "restaurant-1",
        order: 1,
        status: "Rejected",
        rejectionReason: "no_image"
      };

      vi.mocked(mockDb.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockFallback])
            })
          })
        })
      } as unknown as ReturnType<typeof mockDb.select>);

      const repository = new CandidateRepositoryDrizzle(mockDb);

      const result = await repository.findBestRejectedCandidateThatCouldServeAsFallback("search-1");

      expect(result).toEqual(mockFallback);
    });

    it("returns undefined when no fallback candidates exist", async () => {
      const mockDb = createMockDb();

      vi.mocked(mockDb.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([])
            })
          })
        })
      } as unknown as ReturnType<typeof mockDb.select>);

      const repository = new CandidateRepositoryDrizzle(mockDb);

      const result = await repository.findBestRejectedCandidateThatCouldServeAsFallback("search-1");

      expect(result).toBeUndefined();
    });
  });

  describe("recoverCandidate", () => {
    it("creates a recovered candidate from fallback", async () => {
      const mockDb = createMockDb();
      const fallbackCandidate: SearchCandidate = {
        id: "fallback-1",
        searchId: "search-1",
        restaurantId: "restaurant-1",
        order: 1,
        status: "Rejected",
        rejectionReason: "no_image",
        createdAt: new Date(),
        recoveredFromCandidateId: null
      };

      const recoveredCandidate = {
        id: "recovered-1",
        searchId: "search-1",
        restaurantId: "restaurant-1",
        order: 5,
        status: "Returned",
        rejectionReason: null,
        createdAt: new Date(),
        recoveredFromCandidateId: "fallback-1"
      };

      vi.mocked(mockDb.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([recoveredCandidate])
        })
      } as unknown as ReturnType<typeof mockDb.insert>);

      const repository = new CandidateRepositoryDrizzle(mockDb);

      const result = await repository.recoverCandidate(fallbackCandidate, 5);

      expect(result).toEqual(recoveredCandidate);
      expect(result.order).toBe(5);
      expect(result.status).toBe("Returned");
      expect(result.recoveredFromCandidateId).toBe("fallback-1");
    });
  });
});
