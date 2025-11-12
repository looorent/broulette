import { CircuitBreakerError } from "../circuit_breaker/error";

export class GoogleExceedsNumberOfCallsError extends CircuitBreakerError {
  constructor(
    readonly maximumNumberOfCalls: number,
    readonly numberOfCalls: number
  ) {
    super(
      `To reduce the invoice cost, the number of calls to Google Place API is limited. And you have reached it: ${numberOfCalls} calls have been done.`
    );
    this.name = "GoogleExceedsNumberOfCallsError";
  }

  override isRetriable(): boolean {
    return false;
  }
}
