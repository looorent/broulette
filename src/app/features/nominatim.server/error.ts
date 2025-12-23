import { CircuitBreakerError } from "@features/circuit-breaker.server";

export abstract class NominatimError extends CircuitBreakerError {
  constructor(
    message: string,
    readonly query: string,
    readonly responseStatusCode: number,
    readonly responseBody: string,
    readonly durationInMs: number
  ) {
    super(message);
    this.name = "NominatimError";
    this.query = query;
    this.responseStatusCode = responseStatusCode;
    this.responseBody = responseBody;
    this.durationInMs = durationInMs;
  }
}

export class NominatimServerError extends NominatimError {
  constructor(
    query: string,
    responseStatusCode: number,
    responseBody: string,
    durationInMs: number
  ) {
    super(
      `[Nominatim] Fetching addresses: server failed after ${durationInMs} ms with status code ${responseStatusCode}`,
      query,
      responseStatusCode,
      responseBody,
      durationInMs
    );
    this.name = "NominatimServerError";
  }
  override isRetriable(): boolean {
    return true;
  }
}

export class NominatimHttpError extends NominatimError {
  constructor(
    query: string,
    responseStatusCode: number,
    responseBody: string,
    durationInMs: number
  ) {
    super(
      `[Nominatim] Fetching addresses: http call failed after ${durationInMs} ms with status code ${responseStatusCode}`,
      query,
      responseStatusCode,
      responseBody,
      durationInMs
    );
    this.name = "NominatimHttpError";
  }
  override isRetriable(): boolean {
    return false;
  }
}

export class NominatimEmptyResponseError extends NominatimError {
  constructor(
    query: string,
    responseStatusCode: number,
    responseBody: string,
    durationInMs: number
  ) {
    super(
      `[Nominatim] Fetching addresses: empty response after ${durationInMs} ms with status code ${responseStatusCode}`,
      query,
      responseStatusCode,
      responseBody,
      durationInMs
    );
    this.name = "NominatimEmptyResponseError";
  }
  override isRetriable(): boolean {
    return true;
  }
}
