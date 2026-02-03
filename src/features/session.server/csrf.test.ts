import { describe, it, expect, beforeEach } from "vitest";

import { createCSRFToken, CSRF_KEY, validateCSRF } from "./csrf";
import { createAppSessionStorage } from "./session";

describe("CSRF", () => {
  const TEST_SECRET = "test-secret-key-for-testing-purposes-only";
  let sessionStorage: ReturnType<typeof createAppSessionStorage>;

  beforeEach(() => {
    sessionStorage = createAppSessionStorage(TEST_SECRET, false);
  });

  describe("createCSRFToken", () => {
    it("should create a new CSRF token when session has none", async () => {
      const headers = new Headers();

      const result = await createCSRFToken(headers, sessionStorage);

      expect(result.token).toBeDefined();
      expect(result.token).toHaveLength(64);
      expect(result.headers).toBeDefined();
      expect(result.headers).toHaveProperty("Set-Cookie");
    });

    it("should return existing token when session already has one", async () => {
      const headers = new Headers();

      const firstResult = await createCSRFToken(headers, sessionStorage);
      expect(firstResult.headers).toBeDefined();

      const setCookie = (firstResult.headers as Record<string, string>)["Set-Cookie"];
      const secondHeaders = new Headers({ Cookie: setCookie });

      const secondResult = await createCSRFToken(secondHeaders, sessionStorage);

      expect(secondResult.token).toBe(firstResult.token);
      expect(secondResult.headers).toBeUndefined();
    });

    it("should generate cryptographically random tokens", async () => {
      const headers = new Headers();
      const tokens = new Set<string>();

      for (let i = 0; i < 10; i++) {
        const freshSessionStorage = createAppSessionStorage(TEST_SECRET, false);
        const result = await createCSRFToken(headers, freshSessionStorage);
        tokens.add(result.token);
      }

      expect(tokens.size).toBe(10);
    });
  });

  describe("validateCSRF", () => {
    it("should pass validation when token in form data matches session", async () => {
      const headers = new Headers();

      const { token, headers: responseHeaders } = await createCSRFToken(headers, sessionStorage);
      const setCookie = (responseHeaders as Record<string, string>)["Set-Cookie"];

      const requestHeaders = new Headers({ Cookie: setCookie });
      const formData = new FormData();
      formData.set(CSRF_KEY, token);

      await expect(validateCSRF(formData, requestHeaders, sessionStorage)).resolves.toBeUndefined();
    });

    it("should pass validation when token in header matches session", async () => {
      const headers = new Headers();

      const { token, headers: responseHeaders } = await createCSRFToken(headers, sessionStorage);
      const setCookie = (responseHeaders as Record<string, string>)["Set-Cookie"];

      const requestHeaders = new Headers({
        Cookie: setCookie,
        "X-CSRF-Token": token
      });
      const formData = new FormData();

      await expect(validateCSRF(formData, requestHeaders, sessionStorage)).resolves.toBeUndefined();
    });

    it("should reject when no session token exists", async () => {
      const headers = new Headers();
      const formData = new FormData();
      formData.set(CSRF_KEY, "some-token");

      await expect(validateCSRF(formData, headers, sessionStorage)).rejects.toThrow();

      try {
        await validateCSRF(formData, headers, sessionStorage);
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        const response = error as Response;
        expect(response.status).toBe(403);
        expect(await response.text()).toBe("Missing Session Token");
      }
    });

    it("should reject when token does not match", async () => {
      const headers = new Headers();

      const { headers: responseHeaders } = await createCSRFToken(headers, sessionStorage);
      const setCookie = (responseHeaders as Record<string, string>)["Set-Cookie"];

      const requestHeaders = new Headers({ Cookie: setCookie });
      const formData = new FormData();
      formData.set(CSRF_KEY, "wrong-token");

      try {
        await validateCSRF(formData, requestHeaders, sessionStorage);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        const response = error as Response;
        expect(response.status).toBe(403);
        expect(await response.text()).toBe("Invalid CSRF Token");
      }
    });

    it("should reject when no token is provided", async () => {
      const headers = new Headers();

      const { headers: responseHeaders } = await createCSRFToken(headers, sessionStorage);
      const setCookie = (responseHeaders as Record<string, string>)["Set-Cookie"];

      const requestHeaders = new Headers({ Cookie: setCookie });
      const formData = new FormData();

      try {
        await validateCSRF(formData, requestHeaders, sessionStorage);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(Response);
        const response = error as Response;
        expect(response.status).toBe(403);
        expect(await response.text()).toBe("Invalid CSRF Token");
      }
    });

    it("should prefer header token over form data token", async () => {
      const headers = new Headers();

      const { token, headers: responseHeaders } = await createCSRFToken(headers, sessionStorage);
      const setCookie = (responseHeaders as Record<string, string>)["Set-Cookie"];

      const requestHeaders = new Headers({
        Cookie: setCookie,
        "X-CSRF-Token": token
      });
      const formData = new FormData();
      formData.set(CSRF_KEY, "wrong-token");

      await expect(validateCSRF(formData, requestHeaders, sessionStorage)).resolves.toBeUndefined();
    });
  });
});
