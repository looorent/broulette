import { CircuitBreakerError } from "@features/circuit-breaker.server";

export abstract class PhotonError extends CircuitBreakerError {
  constructor(
    message: string,
    readonly query: string,
    readonly responseStatusCode: number,
    readonly responseBody: string,
    readonly durationInMs: number
  ) {
    super(message);
    this.name = "PhotonError";
    this.query = query;
    this.responseStatusCode = responseStatusCode;
    this.responseBody = responseBody;
    this.durationInMs = durationInMs;
  }
}

export class PhotonServerError extends PhotonError {
  constructor(
    query: string,
    responseStatusCode: number,
    responseBody: string,
    durationInMs: number
  ) {
    super(
      `[Photon] Fetching addresses: server failed after ${durationInMs} ms with status code ${responseStatusCode}`,
      query,
      responseStatusCode,
      responseBody,
      durationInMs
    );
    this.name = "PhotonServerError";
  }
  override isRetriable(): boolean {
    return true;
  }
}

export class PhotonHttpError extends PhotonError {
  constructor(
    query: string,
    responseStatusCode: number,
    responseBody: string,
    durationInMs: number
  ) {
    super(
      `[Photon] Fetching addresses: http call failed after ${durationInMs} ms with status code ${responseStatusCode}`,
      query,
      responseStatusCode,
      responseBody,
      durationInMs
    );
    this.name = "PhotonHttpError";
  }
  override isRetriable(): boolean {
    return false;
  }
}

export class PhotonEmptyResponseError extends PhotonError {
  constructor(
    query: string,
    responseStatusCode: number,
    responseBody: string,
    durationInMs: number
  ) {
    super(
      `[Photon] Fetching addresses: empty response after ${durationInMs} ms with status code ${responseStatusCode}`,
      query,
      responseStatusCode,
      responseBody,
      durationInMs
    );
    this.name = "PhotonEmptyResponseError";
  }
  override isRetriable(): boolean {
    return true;
  }
}
