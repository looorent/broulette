import { describe, expect, it, vi } from "vitest";

import { LoadBalancer } from "./balancer";
import type { ServiceStrategy } from "./types";

vi.mock("@features/utils/error", () => ({
  isAbortError: (error: unknown) => error instanceof Error && error.name === "AbortError"
}));

function createMockProvider<TArgs extends unknown[], TResult>(
  name: string,
  execute: (...args: TArgs) => Promise<TResult>
): ServiceStrategy<TArgs, TResult> {
  return { name, execute };
}

describe("LoadBalancer", () => {
  describe("execute", () => {
    it("calls the first provider on first execution", async () => {
      const provider1 = createMockProvider("provider1", async () => "result1");
      const provider2 = createMockProvider("provider2", async () => "result2");

      const balancer = new LoadBalancer([provider1, provider2]);

      const result = await balancer.execute();

      expect(result).toBe("result1");
    });

    it("round-robins to second provider after first success", async () => {
      const provider1 = createMockProvider("provider1", async () => "result1");
      const provider2 = createMockProvider("provider2", async () => "result2");

      const balancer = new LoadBalancer([provider1, provider2]);

      await balancer.execute();
      const result = await balancer.execute();

      expect(result).toBe("result2");
    });

    it("fails over to second provider when first fails", async () => {
      const provider1 = createMockProvider("provider1", async () => {
        throw new Error("Provider 1 failed");
      });
      const provider2 = createMockProvider("provider2", async () => "result2");

      const balancer = new LoadBalancer([provider1, provider2]);

      const result = await balancer.execute();

      expect(result).toBe("result2");
    });

    it("throws when all providers fail", async () => {
      const provider1 = createMockProvider("provider1", async () => {
        throw new Error("Provider 1 failed");
      });
      const provider2 = createMockProvider("provider2", async () => {
        throw new Error("Provider 2 failed");
      });

      const balancer = new LoadBalancer([provider1, provider2]);

      await expect(balancer.execute()).rejects.toThrow("All providers failed");
    });

    it("passes arguments to providers", async () => {
      const executeFn = vi.fn().mockResolvedValue("result");
      const provider = createMockProvider("provider", executeFn);

      const balancer = new LoadBalancer([provider]);

      await balancer.execute("arg1", "arg2", 123);

      expect(executeFn).toHaveBeenCalledWith("arg1", "arg2", 123);
    });

    it("throws immediately when abort signal is aborted", async () => {
      const controller = new AbortController();
      controller.abort();

      const provider = createMockProvider("provider", async (_signal?: AbortSignal) => "result");
      const balancer = new LoadBalancer([provider]);

      await expect(balancer.execute(controller.signal)).rejects.toThrow("Aborted");
    });

    it("throws AbortError when provider throws AbortError", async () => {
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";

      const provider = createMockProvider("provider", async () => {
        throw abortError;
      });

      const balancer = new LoadBalancer([provider]);

      await expect(balancer.execute()).rejects.toBe(abortError);
    });

    it("continues round-robin after failover", async () => {
      let callCount = 0;
      const provider1 = createMockProvider("provider1", async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error("First call failed");
        }
        return "result1";
      });
      const provider2 = createMockProvider("provider2", async () => "result2");

      const balancer = new LoadBalancer([provider1, provider2]);

      const result1 = await balancer.execute();
      expect(result1).toBe("result2");

      const result2 = await balancer.execute();
      expect(result2).toBe("result1");
    });
  });

  describe("numberOfProviders", () => {
    it("returns the number of providers", () => {
      const provider1 = createMockProvider("provider1", async () => "result1");
      const provider2 = createMockProvider("provider2", async () => "result2");

      const balancer = new LoadBalancer([provider1, provider2]);

      expect(balancer.numberOfProviders).toBe(2);
    });

    it("returns 0 for empty provider list", () => {
      const balancer = new LoadBalancer([]);

      expect(balancer.numberOfProviders).toBe(0);
    });
  });
});
