import { CircuitBreakerError } from "@features/circuit-breaker.server";

abstract class NominatimError extends CircuitBreakerError {
  constructor(message: string, readonly responseStatusCode: number) {
    super(message);
    this.name = "NominatimError";
  }
}

export class NominatimServerError extends NominatimError {
  constructor(responseStatusCode: number) {
    super(
      `[Nominatim] Server failed with status code ${responseStatusCode}.`,
      responseStatusCode
    );
    this.name = "NominatimServerError";
  }
  // Retriable: We assume 5xx errors are temporary server issues.
  override isRetriable(): boolean {
    return true;
  }
}

export class NominatimHttpError extends NominatimError {
  constructor(responseStatusCode: number) {
    super(
      `[Nominatim] HTTP request failed with status code ${responseStatusCode}.`,
      responseStatusCode
    );
    this.name = "NominatimHttpError";
  }
  // Not Retriable: We assume 4xx errors (e.g., Bad Request) are permanent.
  override isRetriable(): boolean {
    return false;
  }
}
