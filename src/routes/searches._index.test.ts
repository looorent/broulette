import { describe, it, expect, vi, beforeEach } from "vitest";

import { createAppSessionStorage } from "@features/session.server";

import { action } from "./searches._index";

vi.mock("@features/session.server", async (importOriginal) => {
  const original = await importOriginal<typeof import("@features/session.server")>();
  return {
    ...original,
    validateCSRF: vi.fn().mockResolvedValue(undefined)
  };
});

describe("POST /searches — input validation", () => {
  const TEST_SECRET = "test-secret-key";
  let sessionStorage: ReturnType<typeof createAppSessionStorage>;
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sessionStorage = createAppSessionStorage(TEST_SECRET, false);
    mockCreate = vi.fn();
    vi.clearAllMocks();
  });

  function createRequest(fields: Record<string, string> = {}): Request {
    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      formData.set(key, value);
    }
    return new Request("http://localhost/searches", {
      method: "POST",
      body: formData
    });
  }

  function createContext() {
    return {
      sessionStorage,
      repositories: {
        search: {
          create: mockCreate
        }
      }
    };
  }

  const validFields = {
    serviceDate: "2025-06-15",
    locationLatitude: "48.8566",
    locationLongitude: "2.3522",
    serviceTimeslot: "Lunch",
    distanceRangeId: "Close"
  };

  async function expectValidationError(fields: Record<string, string>, expectedErrorKey: string) {
    try {
      await action({ request: createRequest(fields), context: createContext(), params: {} } as any);
      expect.fail("Should have thrown");
    } catch (thrown: any) {
      expect(thrown.init?.status).toBe(400);
      expect(thrown.data?.errors).toHaveProperty(expectedErrorKey);
    }
  }

  describe("serviceTimeslot validation", () => {
    it("rejects missing timeslot", async () => {
      const { serviceTimeslot: _, ...fields } = validFields;
      await expectValidationError(fields, "serviceTimeslot");
    });

    it("rejects invalid timeslot value", async () => {
      await expectValidationError(
        { ...validFields, serviceTimeslot: "Brunch" },
        "serviceTimeslot"
      );
    });

    it("accepts valid timeslots", async () => {
      for (const timeslot of ["Dinner", "Lunch", "RightNow", "Custom"]) {
        mockCreate.mockResolvedValue({ id: "search-1" });
        // Should not throw a 400
        await action({
          request: createRequest({ ...validFields, serviceTimeslot: timeslot }),
          context: createContext(),
          params: {}
        } as any);
      }
    });
  });

  describe("distanceRange validation", () => {
    it("rejects missing distance range", async () => {
      const { distanceRangeId: _, ...fields } = validFields;
      await expectValidationError(fields, "distanceRangeId");
    });

    it("rejects invalid distance range value", async () => {
      await expectValidationError(
        { ...validFields, distanceRangeId: "VeryFar" },
        "distanceRangeId"
      );
    });

    it("accepts valid distance ranges", async () => {
      for (const range of ["Close", "MidRange", "Far"]) {
        mockCreate.mockResolvedValue({ id: "search-1" });
        await action({
          request: createRequest({ ...validFields, distanceRangeId: range }),
          context: createContext(),
          params: {}
        } as any);
      }
    });
  });

  describe("coordinate validation", () => {
    it("rejects latitude out of range", async () => {
      await expectValidationError(
        { ...validFields, locationLatitude: "91" },
        "locationLatitude"
      );
    });

    it("rejects longitude out of range", async () => {
      await expectValidationError(
        { ...validFields, locationLongitude: "181" },
        "locationLongitude"
      );
    });
  });

  describe("date validation", () => {
    it("rejects invalid date", async () => {
      await expectValidationError(
        { ...validFields, serviceDate: "not-a-date" },
        "serviceDate"
      );
    });
  });

  describe("multiple errors", () => {
    it("returns all validation errors at once", async () => {
      try {
        await action({
          request: createRequest({ serviceDate: "invalid", locationLatitude: "999" }),
          context: createContext(),
          params: {}
        } as any);
        expect.fail("Should have thrown");
      } catch (thrown: any) {
        expect(thrown.init?.status).toBe(400);
        expect(Object.keys(thrown.data?.errors).length).toBeGreaterThanOrEqual(3);
      }
    });
  });
});
