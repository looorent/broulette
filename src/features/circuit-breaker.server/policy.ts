import { isAbortError } from "@features/utils/error";
import { logger } from "@features/utils/logger";

import {
  DEFAULT_CIRCUIT_BREAKER_CACHE_TTL_SECONDS,
  readCircuitBreakerState,
  writeCircuitBreakerState,
  type CircuitBreakerCacheOptions,
  type CircuitBreakerState
} from "./cache";
import { CircuitBreakerError, CircuitOpenError } from "./error";
import type { FailingOperation, FailoverConfiguration } from "./types";

export class CircuitBreaker {
  private failures = 0;
  private nextAttempt = 0;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
  private hydrated = false;

  constructor(
    private readonly name: string,
    private readonly configuration: FailoverConfiguration,
    private cache?: CircuitBreakerCacheOptions
  ) { }

  async execute<T>(operation: FailingOperation<T>, parentSignal?: AbortSignal): Promise<T> {
    return this.withRetry((signal) => this.withCircuitBreaker((s) => this.withTimeout(operation, s), signal), parentSignal);
  }

  withCache(cache: CircuitBreakerCacheOptions | undefined): this {
    this.cache = cache;
    return this;
  }

  private async withCircuitBreaker<T>(op: FailingOperation<T>, signal: AbortSignal): Promise<T> {
    await this.hydrateFromCache();
    const now = Date.now();

    if (this.state === "OPEN") {
      if (now > this.nextAttempt) {
        this.state = "HALF_OPEN";
      } else {
        throw new CircuitOpenError(this.nextAttempt, now);
      }
    }

    try {
      const result = await op(signal);
      this.onSuccess();
      return result;
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        this.onFailure();
      }
      throw err;
    }
  }

  private async hydrateFromCache(): Promise<void> {
    if (!this.hydrated && this.cache) {
      const cached = await readCircuitBreakerState(this.cache.keyStore, this.name);
      if (cached) {
        this.failures = cached.failures;
        this.nextAttempt = cached.nextAttempt;
        this.state = cached.state;
        logger.trace("[CircuitBreaker] Hydrated '%s' from cache: state=%s, failures=%d", this.name, this.state, this.failures);
      }
      this.hydrated = true;
    }
  }

  private persistToCache(): void {
    if (this.cache) {
      const state: CircuitBreakerState = {
        failures: this.failures,
        nextAttempt: this.nextAttempt,
        state: this.state
      };

      const ttl = this.cache.ttlSeconds ?? DEFAULT_CIRCUIT_BREAKER_CACHE_TTL_SECONDS;
      writeCircuitBreakerState(this.cache.keyStore, this.name, state, ttl);
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = "CLOSED";
    this.persistToCache();
  }

  private onFailure() {
    this.failures++;
    if (this.failures >= this.configuration.consecutiveFailures || this.state === "HALF_OPEN") {
      this.state = "OPEN";
      this.nextAttempt = Date.now() + this.configuration.halfOpenAfterInMs;
      logger.warn("[CircuitBreaker] Circuit '%s' opened! Next attempt in %dms", this.name, this.configuration.halfOpenAfterInMs);
    }
    this.persistToCache();
  }

  private async withTimeout<T>(
    op: FailingOperation<T>,
    parentSignal?: AbortSignal
  ): Promise<T> {
    const timeoutSignal = AbortSignal.timeout(this.configuration.timeoutInMs);
    const combinedSignal = parentSignal
      ? AbortSignal.any([parentSignal, timeoutSignal])
      : timeoutSignal;

    try {
      return await op(combinedSignal);
    } catch (error) {
      if (isAbortError(error) && timeoutSignal.aborted && !parentSignal?.aborted) {
        throw new Error(`Operation timed out after ${this.configuration.timeoutInMs}ms`);
      }
      throw error;
    }
  }

  private async withRetry<T>(op: FailingOperation<T>, parentSignal?: AbortSignal): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.configuration.retry + 1; attempt++) {
      if (parentSignal?.aborted) {
        throw parentSignal.reason;
      }

      try {
        return await op(parentSignal!);
      } catch (error: unknown) {
        lastError = error;
        if (isAbortError(error)) {
          throw error;
        } else {
          const isCircuitError = error instanceof CircuitBreakerError;
          const shouldRetry = (isCircuitError && error.isRetriable()) || (!isCircuitError);

          if (shouldRetry) {
            if (attempt <= this.configuration.retry) {
              const delay = Math.pow(2, attempt) * 100;
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          } else {
            throw error;
          }
        }
      }
    }
    throw lastError;
  }
}
