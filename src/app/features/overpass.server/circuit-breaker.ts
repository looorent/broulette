import { initializeCircuitBreaker, type FailoverConfiguration } from "@features/circuit-breaker.server";
import { noop, type IPolicy } from "cockatiel";

let circuitBreakerSingleton: IPolicy | null = null;
let failoverConfiguration: FailoverConfiguration | null;

export function initializeOverpass(configuration: FailoverConfiguration) {
  if (!configuration) {
    if (failoverConfiguration) {
      console.warn("Overpass is already configured. Skip this operation.");
    } else {
      failoverConfiguration = configuration;
    }
  }
}

export function overpassCircuitBreaker(): IPolicy {
  if (!failoverConfiguration) {
    return noop;
  } else if (circuitBreakerSingleton) {
    return circuitBreakerSingleton;
  } else {
    circuitBreakerSingleton = initializeCircuitBreaker(failoverConfiguration);
    return circuitBreakerSingleton;
  }
}
