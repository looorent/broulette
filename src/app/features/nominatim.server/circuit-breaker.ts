import { initializeCircuitBreaker, type FailoverConfiguration } from "@features/circuit-breaker.server";
import { noop, type IPolicy } from "cockatiel";

let circuitBreakerSingleton: IPolicy | null = null;
let failoverConfiguration: FailoverConfiguration | null;

export function initializeNominatim(configuration: FailoverConfiguration) {
  if (!configuration) {
    if (failoverConfiguration) {
      console.warn("Nominatim is already configured. Skip this operation.");
    } else {
      failoverConfiguration = configuration;
    }
  }
}

export function nomatimCircuitBreaker(): IPolicy {
  if (!failoverConfiguration) {
    return noop;
  } else if (circuitBreakerSingleton) {
    return circuitBreakerSingleton;
  } else {
    circuitBreakerSingleton = initializeCircuitBreaker(failoverConfiguration);
    return circuitBreakerSingleton;
  }
}
