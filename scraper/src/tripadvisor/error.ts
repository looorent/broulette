import { CircuitBreakerError } from "../circuit_breaker/error";

export class TripAdvisorExceedsNumberOfCallsError extends CircuitBreakerError {
  constructor(
    readonly maximumNumberOfCalls: number,
    readonly numberOfCalls: number
  ) {
    super(
      `To reduce the invoice cost, the number of calls to TripAdvisor API is limited. And you have reached it: ${numberOfCalls} calls have been done.`
    );
    this.name = "TripAdvisorExceedsNumberOfCallsError";
  }

  override isRetriable(): boolean {
    return false;
  }
}

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
    this.name = "TripAdvisorServerError";
  }
  override isRetriable(): boolean {
    return false;
  }
}

export class TripAdvisorLocationNotFoundError extends TripAdvisorError {
  constructor(
    locationId: number,
    query: string,
    responseStatusCode: number,
    responseBody: string,
    durationInMs: number
  ) {
    super(
      `[TripAdvisor] Search specific location by id '${locationId}': not found after ${durationInMs} ms`,
      query,
      responseStatusCode,
      responseBody,
      durationInMs
    );
    this.name = "TripAdvisorLocationNotFoundError";
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
      `[OSM] Fetching TripAdvisor restaurants: empty response after ${durationInMs} ms with status code ${responseStatusCode}`,
      query,
      responseStatusCode,
      responseBody,
      durationInMs
    );
    this.name = "TripAdvisorEmptyResponseError";
  }
  override isRetriable(): boolean {
    return false;
  }
}
