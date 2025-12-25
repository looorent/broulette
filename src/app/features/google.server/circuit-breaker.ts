import { noop, type IPolicy } from "cockatiel";

import { initializeCircuitBreaker, type FailoverConfiguration } from "@features/circuit-breaker.server";

let circuitBreakerSingleton: IPolicy | null = null;
let failoverConfiguration: FailoverConfiguration | null;

export function initializeGoogle(configuration: FailoverConfiguration) {
  if (!configuration) {
    if (failoverConfiguration) {
      console.warn("Google is already configured. Skip this operation.");
    } else {
      failoverConfiguration = configuration;
    }
  }
}

export function googleCircuitBreaker(): IPolicy {
  if (!failoverConfiguration) {
    return noop;
  } else if (circuitBreakerSingleton) {
    return circuitBreakerSingleton;
  } else {
    circuitBreakerSingleton = initializeCircuitBreaker(failoverConfiguration);
    return circuitBreakerSingleton;
  }
}
