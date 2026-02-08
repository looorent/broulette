import { describe, it, expect, vi, beforeEach } from "vitest";

import { createAppSessionStorage } from "@features/session.server";

import { action, loader } from "./searches._index";

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
    distanceRangeId: "Close",
    avoidFastFood: "true"
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

  describe("coordinate validation (additional cases)", () => {
    it("treats missing latitude as 0 (valid)", async () => {
      // Note: Number(null) = 0, which is valid. This tests actual behavior.
      const { locationLatitude: _, ...fields } = validFields;
      mockCreate.mockResolvedValue({ id: "search-1" });
      await action({
        request: createRequest(fields),
        context: createContext(),
        params: {}
      } as any);
      expect(mockCreate.mock.calls[0][0]).toBe(0); // latitude becomes 0
    });

    it("treats missing longitude as 0 (valid)", async () => {
      // Note: Number(null) = 0, which is valid. This tests actual behavior.
      const { locationLongitude: _, ...fields } = validFields;
      mockCreate.mockResolvedValue({ id: "search-1" });
      await action({
        request: createRequest(fields),
        context: createContext(),
        params: {}
      } as any);
      expect(mockCreate.mock.calls[0][1]).toBe(0); // longitude becomes 0
    });

    it("rejects non-numeric latitude", async () => {
      await expectValidationError(
        { ...validFields, locationLatitude: "not-a-number" },
        "locationLatitude"
      );
    });

    it("rejects non-numeric longitude", async () => {
      await expectValidationError(
        { ...validFields, locationLongitude: "abc" },
        "locationLongitude"
      );
    });

    it("rejects latitude below -90", async () => {
      await expectValidationError(
        { ...validFields, locationLatitude: "-91" },
        "locationLatitude"
      );
    });

    it("rejects longitude below -180", async () => {
      await expectValidationError(
        { ...validFields, locationLongitude: "-181" },
        "locationLongitude"
      );
    });

    it("accepts boundary latitude values", async () => {
      for (const lat of ["-90", "0", "90"]) {
        mockCreate.mockResolvedValue({ id: "search-1" });
        await action({
          request: createRequest({ ...validFields, locationLatitude: lat }),
          context: createContext(),
          params: {}
        } as any);
      }
    });

    it("accepts boundary longitude values", async () => {
      for (const lon of ["-180", "0", "180"]) {
        mockCreate.mockResolvedValue({ id: "search-1" });
        await action({
          request: createRequest({ ...validFields, locationLongitude: lon }),
          context: createContext(),
          params: {}
        } as any);
      }
    });
  });

  describe("date validation (additional cases)", () => {
    it("rejects missing date", async () => {
      const { serviceDate: _, ...fields } = validFields;
      await expectValidationError(fields, "serviceDate");
    });

    it("rejects empty date string", async () => {
      await expectValidationError(
        { ...validFields, serviceDate: "" },
        "serviceDate"
      );
    });

    it("accepts various valid date formats", async () => {
      const validDates = [
        "2025-06-15",
        "2025-12-31T23:59:59",
        "June 15, 2025"
      ];
      for (const date of validDates) {
        mockCreate.mockResolvedValue({ id: "search-1" });
        await action({
          request: createRequest({ ...validFields, serviceDate: date }),
          context: createContext(),
          params: {}
        } as any);
      }
    });
  });

  describe("successful search creation", () => {
    it("creates search with valid data and redirects", async () => {
      mockCreate.mockResolvedValue({ id: "new-search-123" });

      const response = await action({
        request: createRequest(validFields),
        context: createContext(),
        params: {}
      } as any);

      expect(mockCreate).toHaveBeenCalledWith(
        48.8566,
        2.3522,
        expect.any(Date),
        "Lunch",
        "Close",
        true
      );
      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toContain("/searches/new-search-123");
    });

    it("passes parsed date to repository", async () => {
      mockCreate.mockResolvedValue({ id: "search-1" });

      await action({
        request: createRequest({ ...validFields, serviceDate: "2025-06-15" }),
        context: createContext(),
        params: {}
      } as any);

      const calledDate = mockCreate.mock.calls[0][2] as Date;
      expect(calledDate.getFullYear()).toBe(2025);
      expect(calledDate.getMonth()).toBe(5); // June is month 5 (0-indexed)
      expect(calledDate.getDate()).toBe(15);
    });
  });
});

describe("GET /searches — loader", () => {
  it("redirects to home page", async () => {
    const response = await loader();
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/");
  });
});
