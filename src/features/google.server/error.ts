import { CircuitBreakerError } from "@features/circuit-breaker.server";

export abstract class GoogleError extends CircuitBreakerError {
  constructor(
    message: string,
    readonly query: string,
    readonly responseStatusCode: number,
    readonly responseBody: string,
    readonly durationInMs: number
  ) {
    super(message);
    this.name = "GoogleError";
    this.query = query;
    this.responseStatusCode = responseStatusCode;
    this.responseBody = responseBody;
    this.durationInMs = durationInMs;
  }
}

export class GoogleServerError extends GoogleError {
  constructor(
    query: string,
    responseStatusCode: number,
    responseBody: string,
    durationInMs: number
  ) {
    super(
      `[Google] Fetching Google places: server failed after ${durationInMs} ms with status code ${responseStatusCode}`,
      query,
      responseStatusCode,
      responseBody,
      durationInMs
    );
    this.name = "GoogleServerError";
  }
  override isRetriable(): boolean {
    return true;
  }
}

export class GoogleAuthorizationError extends GoogleError {
  constructor(
    query: string,
    responseStatusCode: number,
    responseBody: string,
    durationInMs: number
  ) {
    super(
      `[Google] You must define a valid API Key. Status code received: ${responseStatusCode}`,
      query,
      responseStatusCode,
      responseBody,
      durationInMs
    );
    this.name = "GoogleAuthorizationError";
  }
  override isRetriable(): boolean {
    return false;
  }
}

export class GoogleHttpError extends GoogleError {
  constructor(
    query: string,
    responseStatusCode: number,
    responseBody: string,
    durationInMs: number
  ) {
    super(
      `[Google] Fetching Google places: http call failed after ${durationInMs} ms with status code ${responseStatusCode}`,
      query,
      responseStatusCode,
      responseBody,
      durationInMs
    );
    this.name = "GoogleHttpError";
  }
  override isRetriable(): boolean {
    return false;
  }
}
