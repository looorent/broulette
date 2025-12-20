import { CircuitBreakerError } from "@features/circuit-breaker.server";

export abstract class TripAdvisorError extends CircuitBreakerError {
  constructor(
    message: string,
    readonly query: string,
    readonly responseStatusCode: number,
    readonly responseBody: string,
    readonly durationInMs: number
  ) {
    super(message);
    this.name = "TripAdvisorError";
    this.query = query;
    this.responseStatusCode = responseStatusCode;
    this.responseBody = responseBody;
    this.durationInMs = durationInMs;
  }
}

export class TripAdvisorServerError extends TripAdvisorError {
  constructor(
    query: string,
    responseStatusCode: number,
    responseBody: string,
    durationInMs: number
  ) {
    super(
      `[TripAdvisor] Fetching TripAdvisor restaurants: server failed after ${durationInMs} ms with status code ${responseStatusCode}`,
      query,
      responseStatusCode,
      responseBody,
      durationInMs
    );
    this.name = "TripAdvisorServerError";
  }
  override isRetriable(): boolean {
    return true;
  }
}

export class TripAdvisorHttpError extends TripAdvisorError {
  constructor(
    query: string,
    responseStatusCode: number,
    responseBody: string,
    durationInMs: number
  ) {
    super(
      `[TripAdvisor] Fetching TripAdvisor restaurants: http call failed after ${durationInMs} ms with status code ${responseStatusCode}`,
      query,
      responseStatusCode,
      responseBody,
      durationInMs
    );
    this.name = "TripAdvisorHttpError";
  }
  override isRetriable(): boolean {
    return false;
  }
}

export class TripAdvisorEmptyResponseError extends TripAdvisorError {
  constructor(
    query: string,
    responseStatusCode: number,
    responseBody: string,
    durationInMs: number
  ) {
    super(
      `[TripAdvisor] Fetching TripAdvisor restaurants: empty response after ${durationInMs} ms with status code ${responseStatusCode}`,
      query,
      responseStatusCode,
      responseBody,
      durationInMs
    );
    this.name = "TripAdvisorEmptyResponseError";
  }
  override isRetriable(): boolean {
    return true;
  }
}
