import { CircuitBreakerError } from "@features/circuit-breaker.server";

abstract class PhotonError extends CircuitBreakerError {
  constructor(message: string, readonly responseStatusCode: number) {
    super(message);
    this.name = "PhotonError";
  }
}

export class PhotonServerError extends PhotonError {
  constructor(responseStatusCode: number) {
    super(
      `[Photon] Server failed with status code ${responseStatusCode}.`,
      responseStatusCode
    );
    this.name = "PhotonServerError";
  }
  // Retriable: We assume 5xx errors are temporary server issues.
  override isRetriable(): boolean {
    return true;
  }
}

export class PhotonHttpError extends PhotonError {
  constructor(responseStatusCode: number) {
    super(
      `[Photon] HTTP request failed with status code ${responseStatusCode}.`,
      responseStatusCode
    );
    this.name = "PhotonHttpError";
  }
  // Not Retriable: We assume 4xx errors (e.g., Bad Request) are permanent.
  override isRetriable(): boolean {
    return false;
  }
}
