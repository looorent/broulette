import { describe, it, expect, vi, beforeEach } from "vitest";

import { createAppSessionStorage } from "@features/session.server";

import { action } from "./_.api.address-searches";

vi.mock("@features/session.server", async (importOriginal) => {
  const original = await importOriginal<typeof import("@features/session.server")>();
  return {
    ...original,
    validateCSRF: vi.fn().mockResolvedValue(undefined)
  };
});

vi.mock("@features/address.server", () => ({
  searchLocations: vi.fn().mockResolvedValue({
    locations: [
      {
        label: { display: "Brussels, Belgium", compact: "Brussels" },
        coordinates: { latitude: 50.85, longitude: 4.35 },
        isDeviceLocation: false
      }
    ],
    note: "Powered by Photon"
  })
}));

describe("Address Search API Route", () => {
  const TEST_SECRET = "test-secret-key-for-testing";
  let sessionStorage: ReturnType<typeof createAppSessionStorage>;

  beforeEach(() => {
    sessionStorage = createAppSessionStorage(TEST_SECRET, false);
    vi.clearAllMocks();
  });

  function createRequest(
    method: string,
    formDataEntries: Record<string, string> = {}
  ): Request {
    const formData = new FormData();
    for (const [key, value] of Object.entries(formDataEntries)) {
      formData.set(key, value);
    }

    return new Request("http://localhost/api/address-searches", {
      method,
      body: formData
    });
  }

  function createContext(config: any = { nominatim: { enabled: true }, photon: { enabled: true } }) {
    return { sessionStorage, config };
  }

  describe("HTTP method validation", () => {
    it("should reject GET requests with 405", async () => {
      const request = new Request("http://localhost/api/address-searches", {
        method: "GET"
      });

      try {
        await action({ request, context: createContext(), params: {} } as any);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        expect((error as Response).status).toBe(405);
      }
    });

    it("should reject PUT requests with 405", async () => {
      const request = new Request("http://localhost/api/address-searches", {
        method: "PUT",
        body: new FormData()
      });

      try {
        await action({ request, context: createContext(), params: {} } as any);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        expect((error as Response).status).toBe(405);
      }
    });

    it("should reject DELETE requests with 405", async () => {
      const request = new Request("http://localhost/api/address-searches", {
        method: "DELETE"
      });

      try {
        await action({ request, context: createContext(), params: {} } as any);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        expect((error as Response).status).toBe(405);
      }
    });
  });

  describe("Query validation", () => {
    it("should return empty locations for empty query", async () => {
      const request = createRequest("POST", { query: "" });
      const result = await action({ request, context: createContext(), params: {} } as any);

      expect(result).toEqual({
        locations: [],
        note: undefined
      });
    });

    it("should return empty locations for query shorter than 2 characters", async () => {
      const request = createRequest("POST", { query: "a" });
      const result = await action({ request, context: createContext(), params: {} } as any);

      expect(result).toEqual({
        locations: [],
        note: undefined
      });
    });

    it("should return empty locations when query is missing", async () => {
      const request = createRequest("POST", {});
      const result = await action({ request, context: createContext(), params: {} } as any);

      expect(result).toEqual({
        locations: [],
        note: undefined
      });
    });

    it("should accept queries with 2 or more characters", async () => {
      const request = createRequest("POST", { query: "ab" });
      const result = await action({ request, context: createContext(), params: {} } as any);

      expect(result.locations).toHaveLength(1);
    });
  });

  describe("Successful search", () => {
    it("should return locations for valid query", async () => {
      const request = createRequest("POST", { query: "Brussels" });
      const result = await action({ request, context: createContext(), params: {} } as any);

      expect(result.locations).toHaveLength(1);
      expect(result.locations[0].label.display).toBe("Brussels, Belgium");
      expect(result.note).toBe("Powered by Photon");
    });

    it("should pass location bias to search when provided", async () => {
      const { searchLocations } = await import("@features/address.server");
      const context = createContext();

      const request = createRequest("POST", {
        query: "Namur",
        latitudeBias: "50.85",
        longitudeBias: "4.35"
      });
      await action({ request, context, params: {} } as any);

      expect(searchLocations).toHaveBeenCalledWith(
        "Namur",
        context.config.nominatim,
        context.config.photon,
        { latitude: 50.85, longitude: 4.35 },
        expect.anything()
      );
    });

    it("should not pass location bias when latitude is invalid", async () => {
      const { searchLocations } = await import("@features/address.server");
      const context = createContext();

      const request = createRequest("POST", {
        query: "Namur",
        latitudeBias: "not-a-number",
        longitudeBias: "4.35"
      });
      await action({ request, context, params: {} } as any);

      expect(searchLocations).toHaveBeenCalledWith(
        "Namur",
        context.config.nominatim,
        context.config.photon,
        undefined,
        expect.anything()
      );
    });

    it("should not pass location bias when longitude is invalid", async () => {
      const { searchLocations } = await import("@features/address.server");
      const context = createContext();

      const request = createRequest("POST", {
        query: "Namur",
        latitudeBias: "50.85",
        longitudeBias: "invalid"
      });
      await action({ request, context, params: {} } as any);

      expect(searchLocations).toHaveBeenCalledWith(
        "Namur",
        context.config.nominatim,
        context.config.photon,
        undefined,
        expect.anything()
      );
    });

    it("should not pass location bias when only latitude is provided", async () => {
      const { searchLocations } = await import("@features/address.server");
      const context = createContext();

      const request = createRequest("POST", {
        query: "Namur",
        latitudeBias: "50.85"
      });
      await action({ request, context, params: {} } as any);

      expect(searchLocations).toHaveBeenCalledWith(
        "Namur",
        context.config.nominatim,
        context.config.photon,
        undefined,
        expect.anything()
      );
    });
  });

  describe("Error handling", () => {
    it("should return error response when config is missing", async () => {
      const { searchLocations } = await import("@features/address.server");

      const request = createRequest("POST", { query: "Brussels" });
      const context = { sessionStorage, config: null };
      const result = await action({ request, context, params: {} } as any);

      expect(result.locations).toEqual([]);
      expect(result.error).toBe("Unable to fetch addresses at this time. Please try again.");
      expect(searchLocations).not.toHaveBeenCalled();
    });

    it("should return error response when search fails", async () => {
      const { searchLocations } = await import("@features/address.server");
      vi.mocked(searchLocations).mockRejectedValueOnce(new Error("Network error"));

      const request = createRequest("POST", { query: "Brussels" });
      const result = await action({ request, context: createContext(), params: {} } as any);

      expect(result.locations).toEqual([]);
      expect(result.error).toBe("Unable to fetch addresses at this time. Please try again.");
    });

    it("should return error response when search times out", async () => {
      const { searchLocations } = await import("@features/address.server");
      vi.mocked(searchLocations).mockRejectedValueOnce(new Error("Timeout"));

      const request = createRequest("POST", { query: "Brussels" });
      const result = await action({ request, context: createContext(), params: {} } as any);

      expect(result.locations).toEqual([]);
      expect(result.error).toBe("Unable to fetch addresses at this time. Please try again.");
    });
  });
});
