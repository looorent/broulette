import { describe, expect, it, vi } from "vitest";

import type { CandidateRepository, MatchingRepository, RestaurantRepository, SearchRepository } from "@persistence";

import { searchCandidate } from "./engine";
import { SearchNotFoundError } from "./error";
import type { SearchContext } from "./types";

function createMockSearchRepository(): SearchRepository {
  return {
    create: vi.fn(),
    findWithLatestCandidateId: vi.fn(),
    findByIdWithRestaurantAndProfiles: vi.fn(),
    markSearchAsExhausted: vi.fn()
  };
}

function createMockCandidateRepository(): CandidateRepository {
  return {
    findById: vi.fn(),
    create: vi.fn(),
    findBestRejectedCandidateThatCouldServeAsFallback: vi.fn(),
    recoverCandidate: vi.fn()
  };
}

function createMockRestaurantRepository(): RestaurantRepository {
  return {
    createProfile: vi.fn(),
    updateProfile: vi.fn(),
    findRestaurantWithExternalIdentity: vi.fn(),
    createRestaurantFromDiscovery: vi.fn()
  };
}

function createMockMatchingRepository(): MatchingRepository {
  return {
    doesAttemptExistSince: vi.fn(),
    hasReachedQuota: vi.fn(),
    countMatchingAttemptsDuringMonth: vi.fn(),
    registerAttemptToFindAMatch: vi.fn()
  };
}

function createMockContext(overrides: Partial<SearchContext> = {}): SearchContext {
  return {
    config: overrides.config ?? {
      discovery: { rangeIncreaseMeters: 5000, maxDiscoveryIterations: 1 },
      matching: { tags: { hiddenTags: [], priorityTags: [], maxTags: 5 } },
      range: {
        close: { rangeInMeters: 1500, timeoutInMs: 5000 },
        midRange: { rangeInMeters: 12000, timeoutInMs: 10000 },
        far: { rangeInMeters: 30000, timeoutInMs: 25000 },
      },
    },
    repositories: overrides.repositories ?? {
      search: createMockSearchRepository(),
      candidate: createMockCandidateRepository(),
      restaurant: createMockRestaurantRepository(),
      matching: createMockMatchingRepository(),
    },
    services: overrides.services ?? {},
    signal: overrides.signal,
  };
}

describe("searchCandidate", () => {
  describe("when search is not found", () => {
    it("throws SearchNotFoundError", async () => {
      const searchRepository = createMockSearchRepository();
      vi.mocked(searchRepository.findByIdWithRestaurantAndProfiles).mockResolvedValue(undefined);

      const context = createMockContext({
        repositories: {
          search: searchRepository,
          candidate: createMockCandidateRepository(),
          restaurant: createMockRestaurantRepository(),
          matching: createMockMatchingRepository(),
        },
      });

      const generator = searchCandidate(
        "non-existent-search",
        "en-US",
        context
      );

      const firstEvent = await generator.next();
      expect(firstEvent.value).toEqual({ type: "searching", message: expect.any(String) });

      await expect(generator.next()).rejects.toThrow(SearchNotFoundError);
    });
  });

  describe("when search is exhausted", () => {
    it("yields exhausted event and returns latest candidate", async () => {
      const searchRepository = createMockSearchRepository();
      const candidateRepository = createMockCandidateRepository();

      const exhaustedSearch = {
        id: "search-1",
        exhausted: true,
        latitude: 48.8566,
        longitude: 2.3522,
        serviceDate: new Date(),
        serviceInstant: new Date(),
        serviceEnd: new Date(),
        serviceTimeslot: "Lunch" as const,
        distanceRange: "MidRange" as const,
        createdAt: new Date(),
        candidates: []
      };

      vi.mocked(searchRepository.findByIdWithRestaurantAndProfiles).mockResolvedValue(exhaustedSearch);
      vi.mocked(searchRepository.findWithLatestCandidateId).mockResolvedValue({
        searchId: "search-1",
        exhausted: true,
        serviceTimeslot: "Lunch",
        serviceInstant: new Date(),
        distanceRange: "MidRange",
        latestCandidateId: "candidate-1",
        order: 1
      });
      vi.mocked(candidateRepository.findById).mockResolvedValue({
        id: "candidate-1",
        searchId: "search-1",
        restaurantId: "restaurant-1",
        order: 1,
        status: "Returned",
        rejectionReason: null,
        createdAt: new Date(),
        recoveredFromCandidateId: null,
        search: exhaustedSearch,
        restaurant: null
      });

      const context = createMockContext({
        repositories: {
          search: searchRepository,
          candidate: candidateRepository,
          restaurant: createMockRestaurantRepository(),
          matching: createMockMatchingRepository(),
        },
      });

      const generator = searchCandidate(
        "search-1",
        "en-US",
        context
      );

      const events = [];
      for await (const event of generator) {
        events.push(event);
      }

      expect(events).toContainEqual({ type: "searching", message: expect.any(String) });
      expect(events).toContainEqual({ type: "exhausted", message: expect.any(String) });
      expect(events).toContainEqual({ type: "result", candidate: expect.objectContaining({ id: "candidate-1" }) });
    });

    it("creates default candidate when no latest candidate exists", async () => {
      const searchRepository = createMockSearchRepository();
      const candidateRepository = createMockCandidateRepository();

      const exhaustedSearch = {
        id: "search-1",
        exhausted: true,
        latitude: 48.8566,
        longitude: 2.3522,
        serviceDate: new Date(),
        serviceInstant: new Date(),
        serviceEnd: new Date(),
        serviceTimeslot: "Lunch" as const,
        distanceRange: "MidRange" as const,
        createdAt: new Date(),
        candidates: []
      };

      vi.mocked(searchRepository.findByIdWithRestaurantAndProfiles).mockResolvedValue(exhaustedSearch);
      vi.mocked(searchRepository.findWithLatestCandidateId).mockResolvedValue({
        searchId: "search-1",
        exhausted: true,
        serviceTimeslot: "Lunch",
        serviceInstant: new Date(),
        distanceRange: "MidRange",
        latestCandidateId: undefined,
        order: 0
      });
      vi.mocked(candidateRepository.findById).mockResolvedValue(undefined);

      const defaultCandidate = {
        id: "default-candidate",
        searchId: "search-1",
        restaurantId: null,
        order: 1,
        status: "Rejected" as const,
        rejectionReason: "no_restaurant_found" as const,
        createdAt: new Date(),
        recoveredFromCandidateId: null
      };
      vi.mocked(candidateRepository.create).mockResolvedValue(defaultCandidate);

      const context = createMockContext({
        repositories: {
          search: searchRepository,
          candidate: candidateRepository,
          restaurant: createMockRestaurantRepository(),
          matching: createMockMatchingRepository(),
        },
      });

      const generator = searchCandidate(
        "search-1",
        "en-US",
        context
      );

      const events = [];
      for await (const event of generator) {
        events.push(event);
      }

      expect(events).toContainEqual({ type: "result", candidate: expect.objectContaining({ rejectionReason: "no_restaurant_found" }) });
    });
  });

  describe("event types", () => {
    it("always yields searching event first", async () => {
      const searchRepository = createMockSearchRepository();
      vi.mocked(searchRepository.findByIdWithRestaurantAndProfiles).mockResolvedValue(undefined);

      const context = createMockContext({
        repositories: {
          search: searchRepository,
          candidate: createMockCandidateRepository(),
          restaurant: createMockRestaurantRepository(),
          matching: createMockMatchingRepository(),
        },
      });

      const generator = searchCandidate(
        "search-1",
        "en-US",
        context
      );

      const firstEvent = await generator.next();

      expect(firstEvent.value).toEqual({
        type: "searching",
        message: expect.any(String)
      });
    });
  });
});
