/**
 * Type guard utilities for safe error handling.
 * Use these with `catch (error: unknown)` instead of `catch (error: any)`.
 */

/**
 * Checks if an error is an AbortError (typically from AbortController/fetch).
 */
export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

/**
 * Safely extracts the error name from an unknown error.
 */
export function getErrorName(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.name;
  }
  return undefined;
}

/**
 * Safely extracts the error message from an unknown error.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return String(error);
}

/**
 * Converts an unknown error to an Error instance.
 * Useful when you need to rethrow or wrap errors.
 */
export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(getErrorMessage(error));
}
