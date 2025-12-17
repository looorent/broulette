import { initializeCircuitBreaker, type FailoverConfiguration } from "@features/circuit-breaker.server";
import { noop, type IPolicy } from "cockatiel";

let circuitBreakerSingleton: IPolicy | null = null;

export function initializeNominatim(configuration: FailoverConfiguration) {
  if (!circuitBreakerSingleton && configuration) {
    circuitBreakerSingleton = initializeCircuitBreaker(configuration);
  }
}

export function nomatimCircuitBreaker(): IPolicy {
  return circuitBreakerSingleton || noop;
}
