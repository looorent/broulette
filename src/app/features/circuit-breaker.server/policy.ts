import { CircuitBreakerError, CircuitOpenError } from "./error";
import type { FailingOperation, FailoverConfiguration } from "./types";

export class CircuitBreaker {
  private failures = 0;
  private nextAttempt = 0;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";

  constructor(
    private readonly name: string,
    private readonly configuration: FailoverConfiguration
  ) { }

  async execute<T>(operation: FailingOperation<T>, parentSignal?: AbortSignal): Promise<T> {
    return this.withRetry((signal) => this.withCircuitBreaker((s) => this.withTimeout(operation, s), signal), parentSignal);
  }

  private async withCircuitBreaker<T>(op: FailingOperation<T>, signal: AbortSignal): Promise<T> {
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

  private onSuccess() {
    this.failures = 0;
    this.state = "CLOSED";
  }

  private onFailure() {
    this.failures++;
    if (this.failures >= this.configuration.consecutiveFailures || this.state === "HALF_OPEN") {
      this.state = "OPEN";
      this.nextAttempt = Date.now() + this.configuration.halfOpenAfterInMs;
      console.warn(`[CircuitBreaker] Circuit '${this.name}' opened! Next attempt in ${this.configuration.halfOpenAfterInMs}ms`);
    }
  }

  private async withTimeout<T>(op: FailingOperation<T>, parentSignal?: AbortSignal): Promise<T> {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
      timeoutController.abort(new Error(`Operation timed out after ${this.configuration.timeoutInMs}ms`));
    }, this.configuration.timeoutInMs);

    const combinedSignal = parentSignal ? AbortSignal.any([parentSignal, timeoutController.signal]) : timeoutController.signal;
    try {
      return await op(combinedSignal);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async withRetry<T>(op: FailingOperation<T>, parentSignal?: AbortSignal): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.configuration.retry + 1; attempt++) {
      if (parentSignal?.aborted) {
        throw parentSignal.reason;
      }

      try {
        return await op(parentSignal!);
      } catch (error: any) {
        lastError = error;
        const isAbort = error.name === "AbortError";
        if (isAbort) {
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
