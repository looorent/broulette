import { CircuitBreakerError, NoRetryLeftError } from "./error";

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function createCircuitBreaker<T>(
  asyncFunctionToCall: () => Promise<T>,
  retriesLeft: number = 3,
  resetTimeoutMs: number = 15_000
): Promise<T> {
  while (retriesLeft > 0) {
    try {
      return await asyncFunctionToCall();
    } catch (e) {
      if (
        e instanceof CircuitBreakerError &&
        (e as CircuitBreakerError).isRetriable()
      ) {
        console.debug(
          `[CircuitBreaker] Retrying... ${--retriesLeft} attempts left`
        );
        await sleep(resetTimeoutMs);
      } else {
        throw e;
      }
    }
  }
  throw new NoRetryLeftError();
}
