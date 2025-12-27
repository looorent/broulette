import { type IPolicy } from "cockatiel";

import { initializeCircuitBreaker, type FailoverConfiguration } from "@features/circuit-breaker.server";

let circuitBreakerSingleton: IPolicy | null = null;

export function tripAdvisorCircuitBreaker(failoverConfiguration: FailoverConfiguration): IPolicy {
  if (!circuitBreakerSingleton) {
    circuitBreakerSingleton = initializeCircuitBreaker(failoverConfiguration);
  }
  return circuitBreakerSingleton;
}
