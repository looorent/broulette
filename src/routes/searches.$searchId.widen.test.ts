import { describe, it, expect, vi, beforeEach } from "vitest";

import { createAppSessionStorage } from "@features/session.server";

import { action, loader } from "./searches.$searchId.widen";

vi.mock("@features/session.server", async (importOriginal) => {
  const original = await importOriginal<typeof import("@features/session.server")>();
  return {
    ...original,
    validateCSRF: vi.fn().mockResolvedValue(undefined)
  };
});

describe("POST /searches/:searchId/widen", () => {
  const TEST_SECRET = "test-secret-key";
  let sessionStorage: ReturnType<typeof createAppSessionStorage>;
  let mockCreate: ReturnType<typeof vi.fn>;
  let mockFindByIdWithCandidateContext: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sessionStorage = createAppSessionStorage(TEST_SECRET, false);
    mockCreate = vi.fn();
    mockFindByIdWithCandidateContext = vi.fn();
    vi.clearAllMocks();
  });

  function createRequest(method = "POST"): Request {
    const formData = new FormData();
    formData.set("csrf", "token");
    return new Request("http://localhost/searches/original-id/widen", {
      method,
      body: formData
    });
  }

  function createContext() {
    return {
      sessionStorage,
      repositories: {
        search: {
          create: mockCreate,
          findByIdWithCandidateContext: mockFindByIdWithCandidateContext
        }
      }
    };
  }

  const closeSearch = {
    id: "original-id",
    latitude: 48.8566,
    longitude: 2.3522,
    serviceDate: new Date("2025-06-15"),
    serviceTimeslot: "Lunch" as const,
    distanceRange: "Close" as const,
    avoidFastFood: true,
    avoidTakeaway: false,
    minimumRating: 4.0,
    candidates: []
  };

  it("rejects non-POST methods", async () => {
    await expect(
      action({
        request: createRequest("PUT"),
        context: createContext(),
        params: { searchId: "original-id" }
      } as any)
    ).rejects.toEqual(expect.objectContaining({ status: 405 }));
  });

  it("redirects home when search is not found", async () => {
    mockFindByIdWithCandidateContext.mockResolvedValue(undefined);

    const response = await action({
      request: createRequest(),
      context: createContext(),
      params: { searchId: "nonexistent-id" }
    } as any);

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("redirects home when distance range is not Close", async () => {
    mockFindByIdWithCandidateContext.mockResolvedValue({
      ...closeSearch,
      distanceRange: "MidRange"
    });

    const response = await action({
      request: createRequest(),
      context: createContext(),
      params: { searchId: "original-id" }
    } as any);

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("redirects home when distance range is Far", async () => {
    mockFindByIdWithCandidateContext.mockResolvedValue({
      ...closeSearch,
      distanceRange: "Far"
    });

    const response = await action({
      request: createRequest(),
      context: createContext(),
      params: { searchId: "original-id" }
    } as any);

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("creates a new search with MidRange and redirects to it", async () => {
    mockFindByIdWithCandidateContext.mockResolvedValue(closeSearch);
    mockCreate.mockResolvedValue({ id: "widened-search-id" });

    const response = await action({
      request: createRequest(),
      context: createContext(),
      params: { searchId: "original-id" }
    } as any);

    expect(mockCreate).toHaveBeenCalledWith(
      closeSearch.latitude,
      closeSearch.longitude,
      closeSearch.serviceDate,
      closeSearch.serviceTimeslot,
      "MidRange",
      closeSearch.avoidFastFood,
      closeSearch.avoidTakeaway,
      closeSearch.minimumRating
    );
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toContain("/searches/widened-search-id");
  });

  it("preserves all original search parameters except distance range", async () => {
    const customSearch = {
      ...closeSearch,
      latitude: 40.7128,
      longitude: -74.006,
      serviceTimeslot: "Dinner" as const,
      avoidFastFood: false,
      avoidTakeaway: true,
      minimumRating: 3.5
    };
    mockFindByIdWithCandidateContext.mockResolvedValue(customSearch);
    mockCreate.mockResolvedValue({ id: "new-id" });

    await action({
      request: createRequest(),
      context: createContext(),
      params: { searchId: "original-id" }
    } as any);

    expect(mockCreate).toHaveBeenCalledWith(
      40.7128,
      -74.006,
      customSearch.serviceDate,
      "Dinner",
      "MidRange",
      false,
      true,
      3.5
    );
  });
});

describe("GET /searches/:searchId/widen — loader", () => {
  it("redirects to home page", async () => {
    const response = await loader();
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/");
  });
});
