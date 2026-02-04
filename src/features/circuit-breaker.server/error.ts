import { logger } from "@features/utils/logger";

export function createResponseErrorParser(
  logPrefix: string
) {
  return async function parseError(query: string, response: Response, durationInMs: number): Promise<ApiError> {
    const body = await response.text();
    logger.error("[%s] Request failed after %dms. Status: %d.", logPrefix, durationInMs, response.status);
    if (response.status >= 500) {
      return new ApiServerError(logPrefix, query, response.status, body, durationInMs);
    }
    return new ApiHttpError(logPrefix, query, response.status, body, durationInMs);
  };
}

export abstract class CircuitBreakerError extends Error {
  constructor(
    message: string,
    readonly retriable: boolean = false
  ) {
    super(message);
  }

  abstract isRetriable(): boolean;
}

export abstract class ApiError extends CircuitBreakerError {
  constructor(
    message: string,
    readonly query: string,
    readonly responseStatusCode: number,
    readonly responseBody: string,
    readonly durationInMs: number
  ) {
    super(message);
  }
}

export class ApiServerError extends ApiError {
  constructor(prefix: string, query: string, statusCode: number, body: string, durationInMs: number) {
    super(`[${prefix}] Server failed after ${durationInMs}ms with status code ${statusCode}`, query, statusCode, body, durationInMs);
    this.name = `${prefix}ServerError`;
  }
  override isRetriable(): boolean {
    return true;
  }
}

export class ApiHttpError extends ApiError {
  constructor(prefix: string, query: string, statusCode: number, body: string, durationInMs: number) {
    super(`[${prefix}] HTTP call failed after ${durationInMs}ms with status code ${statusCode}`, query, statusCode, body, durationInMs);
    this.name = `${prefix}HttpError`;
  }
  override isRetriable(): boolean {
    return false;
  }
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

