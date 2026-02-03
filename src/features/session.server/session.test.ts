import { describe, it, expect } from "vitest";

import { createAppSessionStorage } from "./session";

describe("Session Storage", () => {
  const TEST_SECRET = "test-secret-key-for-testing-purposes-only";

  describe("createAppSessionStorage", () => {
    it("should create a session storage with correct configuration", async () => {
      const sessionStorage = createAppSessionStorage(TEST_SECRET, false);

      expect(sessionStorage).toBeDefined();
      expect(sessionStorage.getSession).toBeDefined();
      expect(sessionStorage.commitSession).toBeDefined();
      expect(sessionStorage.destroySession).toBeDefined();
    });

    it("should create a new session when no cookie exists", async () => {
      const sessionStorage = createAppSessionStorage(TEST_SECRET, false);
      const headers = new Headers();

      const session = await sessionStorage.getSession(headers.get("Cookie"));

      expect(session).toBeDefined();
      expect(session.id).toBe("");
    });

    it("should persist data in session", async () => {
      const sessionStorage = createAppSessionStorage(TEST_SECRET, false);

      const session = await sessionStorage.getSession();
      session.set("csrf", "test-token-123");

      const cookie = await sessionStorage.commitSession(session);
      expect(cookie).toContain("__session=");

      const retrievedSession = await sessionStorage.getSession(cookie);
      expect(retrievedSession.get("csrf")).toBe("test-token-123");
    });

    it("should return empty value for non-existent key", async () => {
      const sessionStorage = createAppSessionStorage(TEST_SECRET, false);
      const session = await sessionStorage.getSession();

      expect(session.get("nonexistent" as any)).toBeUndefined();
      expect(session.has("nonexistent" as any)).toBe(false);
    });

    it("should destroy session", async () => {
      const sessionStorage = createAppSessionStorage(TEST_SECRET, false);

      const session = await sessionStorage.getSession();
      session.set("csrf", "test-token");
      await sessionStorage.commitSession(session);

      const destroyCookie = await sessionStorage.destroySession(session);
      expect(destroyCookie).toContain("__session=");
      expect(destroyCookie).toContain("Expires=Thu, 01 Jan 1970");
    });

    it("should handle flash data", async () => {
      const sessionStorage = createAppSessionStorage(TEST_SECRET, false);

      const session = await sessionStorage.getSession();
      session.flash("error", "Something went wrong");
      const cookie = await sessionStorage.commitSession(session);

      const session1 = await sessionStorage.getSession(cookie);
      expect(session1.get("error")).toBe("Something went wrong");

      const cookie2 = await sessionStorage.commitSession(session1);
      const session2 = await sessionStorage.getSession(cookie2);
      expect(session2.get("error")).toBeUndefined();
    });

    it("should create secure cookies when secure flag is true", async () => {
      const sessionStorage = createAppSessionStorage(TEST_SECRET, true);
      const session = await sessionStorage.getSession();
      session.set("csrf", "test");

      const cookie = await sessionStorage.commitSession(session);

      expect(cookie).toContain("Secure");
    });

    it("should not include Secure flag when secure is false", async () => {
      const sessionStorage = createAppSessionStorage(TEST_SECRET, false);
      const session = await sessionStorage.getSession();
      session.set("csrf", "test");

      const cookie = await sessionStorage.commitSession(session);

      expect(cookie).not.toContain("Secure");
    });

    it("should include HttpOnly flag", async () => {
      const sessionStorage = createAppSessionStorage(TEST_SECRET, false);
      const session = await sessionStorage.getSession();
      session.set("csrf", "test");

      const cookie = await sessionStorage.commitSession(session);

      expect(cookie).toContain("HttpOnly");
    });

    it("should include SameSite=Lax", async () => {
      const sessionStorage = createAppSessionStorage(TEST_SECRET, false);
      const session = await sessionStorage.getSession();
      session.set("csrf", "test");

      const cookie = await sessionStorage.commitSession(session);

      expect(cookie).toContain("SameSite=Lax");
    });

    it("should handle invalid cookie gracefully", async () => {
      const sessionStorage = createAppSessionStorage(TEST_SECRET, false);

      const retrievedSession = await sessionStorage.getSession("invalid-cookie-data");

      expect(retrievedSession.get("csrf")).toBeUndefined();
      expect(retrievedSession.has("csrf")).toBe(false);
    });

    it("should handle empty cookie gracefully", async () => {
      const sessionStorage = createAppSessionStorage(TEST_SECRET, false);

      const retrievedSession = await sessionStorage.getSession("");

      expect(retrievedSession.get("csrf")).toBeUndefined();
    });

    it("should handle null cookie gracefully", async () => {
      const sessionStorage = createAppSessionStorage(TEST_SECRET, false);

      const retrievedSession = await sessionStorage.getSession(null);

      expect(retrievedSession.get("csrf")).toBeUndefined();
    });
  });
});
