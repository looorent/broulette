export abstract class CircuitBreakerError extends Error {
  constructor(
    message: string,
    readonly retriable: boolean = false
  ) {
    super(message);
  }

  abstract isRetriable(): boolean;
}

export class CircuitOpenError extends CircuitBreakerError {
  constructor(nextAttempt: number, now: number) {
    super(`Circuit is OPEN. Retrying in ${Math.ceil((nextAttempt - now) / 1000)}s`, false);
    this.name = "CircuitOpenError";
  }

  isRetriable(): boolean {
    return false;
  }
}

