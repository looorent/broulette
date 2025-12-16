import { CircuitBreakerError, NoRetryLeftError } from "./error";

function sleep(milliseconds: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(signal.reason || new Error("Aborted"));
  } else {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        cleanup();
        resolve();
      }, milliseconds);

      const onAbort = () => {
        cleanup();
        clearTimeout(timeoutId);
        reject(signal?.reason || new Error("Aborted"));
      };

      const cleanup = () => {
        signal?.removeEventListener("abort", onAbort);
      };

      signal?.addEventListener("abort", onAbort);
    });
  }
}

export async function createCircuitBreaker<T>(
  asyncFunctionToCall: () => Promise<T>,
  retriesLeft: number = 3,
  resetTimeoutMs: number = 5_000,
  signal?: AbortSignal
): Promise<T> {
  while (retriesLeft > 0) {
    if (signal?.aborted) {
      throw signal.reason || new Error("Aborted");
    }

    try {
      return await asyncFunctionToCall();
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        throw e;
      } else if (e instanceof CircuitBreakerError && (e as CircuitBreakerError).isRetriable()) {
        console.debug(`[CircuitBreaker] Retrying... ${--retriesLeft} attempts left`);

        try {
          await sleep(resetTimeoutMs, signal);
        } catch (sleepError) {
          throw sleepError;
        }
      } else {
        throw e;
      }
    }
  }
  throw new NoRetryLeftError();
}
