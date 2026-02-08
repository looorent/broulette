import { describe, expect, it, vi } from "vitest";

import type { CircuitBreakerCacheOptions, CircuitBreakerState } from "./cache";
import { CircuitBreaker } from "./policy";
import type { FailoverConfiguration } from "./types";

function createConfiguration(overrides: Partial<FailoverConfiguration> = {}): FailoverConfiguration {
  return {
    retry: 0,
    halfOpenAfterInMs: 1000,
    timeoutInMs: 5000,
    consecutiveFailures: 3,
    ...overrides
  };
}

function createMockKV(): KVNamespace & { store: Map<string, { value: string; ttl?: number }> } {
  const store = new Map<string, { value: string; ttl?: number }>();
  return {
    store,
    get: vi.fn(async (key: string) => {
      const item = store.get(key);
      return item?.value ?? null;
    }),
    put: vi.fn(async (key: string, value: string, options?: { expirationTtl?: number }) => {
      store.set(key, { value, ttl: options?.expirationTtl });
    }),
    delete: vi.fn(async (key: string) => {
      store.delete(key);
    }),
    list: vi.fn(),
    getWithMetadata: vi.fn()
  } as unknown as KVNamespace & { store: Map<string, { value: string; ttl?: number }> };
}

describe("CircuitBreaker Cache", () => {
  describe("cache write on state change", () => {
    it("persists state to cache on success", async () => {
      const mockKV = createMockKV();
      const cache: CircuitBreakerCacheOptions = { keyStore: mockKV, ttlSeconds: 60 };
      const breaker = new CircuitBreaker("test", createConfiguration(), cache);

      await breaker.execute(async () => "success");

      expect(mockKV.put).toHaveBeenCalledWith(
        "circuit-breaker:test",
        expect.any(String),
        { expirationTtl: 60 }
      );

      const stored = JSON.parse(mockKV.store.get("circuit-breaker:test")!.value) as CircuitBreakerState;
      expect(stored.state).toBe("CLOSED");
      expect(stored.failures).toBe(0);
    });

    it("persists state to cache on failure", async () => {
      const mockKV = createMockKV();
      const cache: CircuitBreakerCacheOptions = { keyStore: mockKV, ttlSeconds: 60 };
      const breaker = new CircuitBreaker("test", createConfiguration(), cache);

      await expect(breaker.execute(async () => {
        throw new Error("failure");
      })).rejects.toThrow("failure");

      expect(mockKV.put).toHaveBeenCalled();
      const stored = JSON.parse(mockKV.store.get("circuit-breaker:test")!.value) as CircuitBreakerState;
      expect(stored.state).toBe("CLOSED");
      expect(stored.failures).toBe(1);
    });

    it("persists OPEN state with nextAttempt timestamp", async () => {
      const mockKV = createMockKV();
      const cache: CircuitBreakerCacheOptions = { keyStore: mockKV, ttlSeconds: 60 };
      const breaker = new CircuitBreaker("test", createConfiguration({ consecutiveFailures: 2 }), cache);

      // Trigger 2 failures to open circuit
      for (let i = 0; i < 2; i++) {
        await expect(breaker.execute(async () => {
          throw new Error("failure");
        })).rejects.toThrow();
      }

      const stored = JSON.parse(mockKV.store.get("circuit-breaker:test")!.value) as CircuitBreakerState;
      expect(stored.state).toBe("OPEN");
      expect(stored.failures).toBe(2);
      expect(stored.nextAttempt).toBeGreaterThan(Date.now());
    });
  });

  describe("cache hydration", () => {
    it("hydrates state from cache on first execute", async () => {
      const mockKV = createMockKV();
      const initialState: CircuitBreakerState = {
        failures: 2,
        nextAttempt: 0,
        state: "CLOSED"
      };
      mockKV.store.set("circuit-breaker:test", { value: JSON.stringify(initialState) });

      const cache: CircuitBreakerCacheOptions = { keyStore: mockKV, ttlSeconds: 60 };
      const breaker = new CircuitBreaker("test", createConfiguration({ consecutiveFailures: 3 }), cache);

      // One more failure should open circuit (2 + 1 = 3)
      await expect(breaker.execute(async () => {
        throw new Error("failure");
      })).rejects.toThrow("failure");

      const stored = JSON.parse(mockKV.store.get("circuit-breaker:test")!.value) as CircuitBreakerState;
      expect(stored.state).toBe("OPEN");
      expect(stored.failures).toBe(3);
    });

    it("hydrates OPEN state and throws CircuitOpenError", async () => {
      const mockKV = createMockKV();
      const initialState: CircuitBreakerState = {
        failures: 3,
        nextAttempt: Date.now() + 10000,
        state: "OPEN"
      };
      mockKV.store.set("circuit-breaker:test", { value: JSON.stringify(initialState) });

      const cache: CircuitBreakerCacheOptions = { keyStore: mockKV, ttlSeconds: 60 };
      const breaker = new CircuitBreaker("test", createConfiguration(), cache);

      await expect(breaker.execute(async () => "result")).rejects.toThrow(/Retrying in/);
    });

    it("hydrates OPEN state and transitions to HALF_OPEN when nextAttempt has passed", async () => {
      const mockKV = createMockKV();
      const initialState: CircuitBreakerState = {
        failures: 3,
        nextAttempt: Date.now() - 1000, // Already passed
        state: "OPEN"
      };
      mockKV.store.set("circuit-breaker:test", { value: JSON.stringify(initialState) });

      const cache: CircuitBreakerCacheOptions = { keyStore: mockKV, ttlSeconds: 60 };
      const breaker = new CircuitBreaker("test", createConfiguration(), cache);

      // Should succeed in HALF_OPEN state
      await expect(breaker.execute(async () => "recovered")).resolves.toBe("recovered");

      const stored = JSON.parse(mockKV.store.get("circuit-breaker:test")!.value) as CircuitBreakerState;
      expect(stored.state).toBe("CLOSED");
      expect(stored.failures).toBe(0);
    });

    it("only hydrates once per circuit breaker instance", async () => {
      const mockKV = createMockKV();
      const cache: CircuitBreakerCacheOptions = { keyStore: mockKV, ttlSeconds: 60 };
      const breaker = new CircuitBreaker("test", createConfiguration(), cache);

      await breaker.execute(async () => "first");
      await breaker.execute(async () => "second");
      await breaker.execute(async () => "third");

      // get should only be called once for hydration
      expect(mockKV.get).toHaveBeenCalledTimes(1);
    });
  });

  describe("withCache", () => {
    it("allows setting cache after construction", async () => {
      const mockKV = createMockKV();
      const cache: CircuitBreakerCacheOptions = { keyStore: mockKV, ttlSeconds: 120 };
      const breaker = new CircuitBreaker("test", createConfiguration());

      // Set cache after construction using chained method
      await breaker.withCache(cache).execute(async () => "success");

      expect(mockKV.put).toHaveBeenCalledWith(
        "circuit-breaker:test",
        expect.any(String),
        { expirationTtl: 120 }
      );
    });
  });

  describe("without cache", () => {
    it("works normally without cache configured", async () => {
      const breaker = new CircuitBreaker("test", createConfiguration());

      const result = await breaker.execute(async () => "success");
      expect(result).toBe("success");
    });
  });

  describe("cache error handling", () => {
    it("continues execution when cache read fails", async () => {
      const mockKV = createMockKV();
      mockKV.get = vi.fn(async () => {
        throw new Error("KV unavailable");
      });
      const cache: CircuitBreakerCacheOptions = { keyStore: mockKV, ttlSeconds: 60 };
      const breaker = new CircuitBreaker("test", createConfiguration(), cache);

      // Should still work despite cache error
      const result = await breaker.execute(async () => "success");
      expect(result).toBe("success");
    });

    it("continues execution when cache write fails", async () => {
      const mockKV = createMockKV();
      mockKV.put = vi.fn(async () => {
        throw new Error("KV unavailable");
      });
      const cache: CircuitBreakerCacheOptions = { keyStore: mockKV, ttlSeconds: 60 };
      const breaker = new CircuitBreaker("test", createConfiguration(), cache);

      // Should still work despite cache write error
      const result = await breaker.execute(async () => "success");
      expect(result).toBe("success");
    });
  });
});
