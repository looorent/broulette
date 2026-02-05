import { describe, expect, it } from "vitest";

import { ApiHttpError, ApiServerError, CircuitOpenError } from "./error";
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

describe("CircuitBreaker", () => {
  describe("successful operations", () => {
    it("executes operation and returns result", async () => {
      const breaker = new CircuitBreaker("test", createConfiguration());

      const result = await breaker.execute(async () => "success");

      expect(result).toBe("success");
    });

    it("passes abort signal to operation", async () => {
      const breaker = new CircuitBreaker("test", createConfiguration());
      let receivedSignal: AbortSignal | undefined;

      await breaker.execute(async (signal) => {
        receivedSignal = signal;
        return "done";
      });

      expect(receivedSignal).toBeDefined();
      expect(receivedSignal).toBeInstanceOf(AbortSignal);
    });
  });

  describe("timeout", () => {
    it("throws timeout error when operation exceeds timeout", async () => {
      const breaker = new CircuitBreaker("test", createConfiguration({ timeoutInMs: 50 }));

      const slowOperation = async (signal: AbortSignal) => {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(resolve, 200);
          signal.addEventListener("abort", () => {
            clearTimeout(timeout);
            reject(signal.reason);
          });
        });
        return "result";
      };

      await expect(breaker.execute(slowOperation)).rejects.toThrow(/timeout/i);
    }, 10000);

    it("succeeds when operation completes before timeout", async () => {
      const breaker = new CircuitBreaker("test", createConfiguration({ timeoutInMs: 200 }));

      const fastOperation = async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
        return "fast result";
      };

      await expect(breaker.execute(fastOperation)).resolves.toBe("fast result");
    });
  });

  describe("retry logic", () => {
    it("retries operation on failure", async () => {
      const breaker = new CircuitBreaker("test", createConfiguration({ retry: 2, consecutiveFailures: 10 }));
      let attempts = 0;

      const result = await breaker.execute(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error("temporary failure");
        }
        return "success after retries";
      });

      expect(attempts).toBe(3);
      expect(result).toBe("success after retries");
    }, 10000);

    it("throws after exhausting all retries", async () => {
      const breaker = new CircuitBreaker("test", createConfiguration({ retry: 2, consecutiveFailures: 10 }));
      let attempts = 0;

      await expect(
        breaker.execute(async () => {
          attempts++;
          throw new Error("persistent failure");
        })
      ).rejects.toThrow("persistent failure");

      expect(attempts).toBe(3); // 1 initial + 2 retries
    }, 10000);

    it("uses exponential backoff between retries", async () => {
      const breaker = new CircuitBreaker("test", createConfiguration({ retry: 2, consecutiveFailures: 10 }));
      const timestamps: number[] = [];

      await expect(
        breaker.execute(async () => {
          timestamps.push(Date.now());
          throw new Error("failure");
        })
      ).rejects.toThrow("failure");

      expect(timestamps).toHaveLength(3);

      // Check delays (exponential backoff: 2^1*100=200ms, 2^2*100=400ms)
      expect(timestamps[1] - timestamps[0]).toBeGreaterThanOrEqual(180); // ~200ms with tolerance
      expect(timestamps[2] - timestamps[1]).toBeGreaterThanOrEqual(380); // ~400ms with tolerance
    }, 10000);

    it("does not retry on abort error", async () => {
      const breaker = new CircuitBreaker("test", createConfiguration({ retry: 3 }));
      let attempts = 0;

      const abortError = new Error("Aborted");
      abortError.name = "AbortError";

      await expect(
        breaker.execute(async () => {
          attempts++;
          throw abortError;
        })
      ).rejects.toBe(abortError);

      expect(attempts).toBe(1);
    });

    it("does not retry on non-retriable circuit breaker errors", async () => {
      const breaker = new CircuitBreaker("test", createConfiguration({ retry: 3 }));
      let attempts = 0;

      const nonRetriableError = new ApiHttpError("Test", "query", 400, "Bad Request", 100);

      await expect(
        breaker.execute(async () => {
          attempts++;
          throw nonRetriableError;
        })
      ).rejects.toBe(nonRetriableError);

      expect(attempts).toBe(1);
    });

    it("retries on retriable circuit breaker errors", async () => {
      const breaker = new CircuitBreaker("test", createConfiguration({ retry: 2, consecutiveFailures: 10 }));
      let attempts = 0;

      await expect(
        breaker.execute(async () => {
          attempts++;
          throw new ApiServerError("Test", "query", 500, "Server Error", 100);
        })
      ).rejects.toBeInstanceOf(ApiServerError);

      expect(attempts).toBe(3);
    }, 10000);
  });

  describe("circuit breaker state machine", () => {
    it("starts in CLOSED state", async () => {
      const breaker = new CircuitBreaker("test", createConfiguration({ consecutiveFailures: 3 }));

      // Should execute normally in CLOSED state
      await expect(breaker.execute(async () => "result")).resolves.toBe("result");
    });

    it("opens circuit after consecutive failures threshold", async () => {
      const breaker = new CircuitBreaker("test", createConfiguration({ retry: 0, consecutiveFailures: 3, halfOpenAfterInMs: 1000 }));

      // Cause 3 consecutive failures
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(async () => {
          throw new Error("failure");
        })).rejects.toThrow("failure");
      }

      // Circuit should now be OPEN
      await expect(breaker.execute(async () => "result")).rejects.toBeInstanceOf(CircuitOpenError);
    });

    it("resets failure count on success", async () => {
      const breaker = new CircuitBreaker("test", createConfiguration({ retry: 0, consecutiveFailures: 3 }));

      // 2 failures (not enough to open)
      for (let i = 0; i < 2; i++) {
        await expect(breaker.execute(async () => {
          throw new Error("failure");
        })).rejects.toThrow();
      }

      // Success resets counter
      await expect(breaker.execute(async () => "success")).resolves.toBe("success");

      // 2 more failures should still not open circuit (counter was reset)
      for (let i = 0; i < 2; i++) {
        await expect(breaker.execute(async () => {
          throw new Error("failure");
        })).rejects.toThrow("failure");
      }

      // Circuit should still be closed
      await expect(breaker.execute(async () => "still works")).resolves.toBe("still works");
    });

    it("transitions to HALF_OPEN after halfOpenAfterInMs", async () => {
      const breaker = new CircuitBreaker("test", createConfiguration({ retry: 0, consecutiveFailures: 2, halfOpenAfterInMs: 100 }));

      // Open the circuit
      for (let i = 0; i < 2; i++) {
        await expect(breaker.execute(async () => {
          throw new Error("failure");
        })).rejects.toThrow();
      }

      // Verify circuit is open
      await expect(breaker.execute(async () => "result")).rejects.toBeInstanceOf(CircuitOpenError);

      // Wait past halfOpenAfterInMs
      await new Promise(resolve => setTimeout(resolve, 150));

      // Circuit should now be HALF_OPEN, allowing a test request
      await expect(breaker.execute(async () => "half-open success")).resolves.toBe("half-open success");
    });

    it("closes circuit on success in HALF_OPEN state", async () => {
      const breaker = new CircuitBreaker("test", createConfiguration({ retry: 0, consecutiveFailures: 2, halfOpenAfterInMs: 50 }));

      // Open the circuit
      for (let i = 0; i < 2; i++) {
        await expect(breaker.execute(async () => {
          throw new Error("failure");
        })).rejects.toThrow();
      }

      // Wait for half-open
      await new Promise(resolve => setTimeout(resolve, 100));

      // Successful request in HALF_OPEN closes the circuit
      await expect(breaker.execute(async () => "recovered")).resolves.toBe("recovered");

      // Circuit should now be CLOSED - subsequent requests should work
      await expect(breaker.execute(async () => "normal")).resolves.toBe("normal");
    });

    it("reopens circuit on failure in HALF_OPEN state", async () => {
      const breaker = new CircuitBreaker("test", createConfiguration({ retry: 0, consecutiveFailures: 2, halfOpenAfterInMs: 50 }));

      // Open the circuit
      for (let i = 0; i < 2; i++) {
        await expect(breaker.execute(async () => {
          throw new Error("failure");
        })).rejects.toThrow();
      }

      // Wait for half-open
      await new Promise(resolve => setTimeout(resolve, 100));

      // Failure in HALF_OPEN reopens the circuit immediately
      await expect(breaker.execute(async () => {
        throw new Error("still failing");
      })).rejects.toThrow("still failing");

      // Circuit should be OPEN again
      await expect(breaker.execute(async () => "result")).rejects.toBeInstanceOf(CircuitOpenError);
    });

    it("does not count abort errors as failures", async () => {
      const breaker = new CircuitBreaker("test", createConfiguration({ retry: 0, consecutiveFailures: 2 }));

      const abortError = new Error("Aborted");
      abortError.name = "AbortError";

      // Two abort errors should not open the circuit
      for (let i = 0; i < 2; i++) {
        await expect(breaker.execute(async () => {
          throw abortError;
        })).rejects.toBe(abortError);
      }

      // Circuit should still be closed
      await expect(breaker.execute(async () => "still works")).resolves.toBe("still works");
    });
  });

  describe("parent signal handling", () => {
    it("throws immediately when parent signal is already aborted", async () => {
      const breaker = new CircuitBreaker("test", createConfiguration());
      const controller = new AbortController();
      controller.abort();

      await expect(
        breaker.execute(async () => "result", controller.signal)
      ).rejects.toThrow();
    });

    it("respects parent signal during execution", async () => {
      const breaker = new CircuitBreaker("test", createConfiguration({ timeoutInMs: 5000 }));
      const controller = new AbortController();

      const promise = breaker.execute(async (signal) => {
        await new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => reject(signal.reason));
        });
        return "result";
      }, controller.signal);

      // Abort after a short delay
      setTimeout(() => controller.abort(), 50);

      await expect(promise).rejects.toThrow();
    });
  });

  describe("CircuitOpenError", () => {
    it("includes time until next attempt in message", async () => {
      const breaker = new CircuitBreaker("test", createConfiguration({ retry: 0, consecutiveFailures: 1, halfOpenAfterInMs: 5000 }));

      // Open the circuit
      await expect(breaker.execute(async () => {
        throw new Error("failure");
      })).rejects.toThrow();

      // Try to execute while open
      try {
        await breaker.execute(async () => "result");
      } catch (error) {
        expect(error).toBeInstanceOf(CircuitOpenError);
        expect((error as CircuitOpenError).message).toMatch(/Retrying in \d+s/);
      }
    });

    it("is not retriable", () => {
      const error = new CircuitOpenError(Date.now() + 5000, Date.now());
      expect(error.isRetriable()).toBe(false);
    });
  });
});
