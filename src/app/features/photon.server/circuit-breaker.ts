import { type IPolicy } from "cockatiel";

import { initializeCircuitBreaker, type FailoverConfiguration } from "@features/circuit-breaker.server";

const circuitBreakerSingletonPerInstanceUrl: { [instanceUrl: string]: IPolicy } = {};

export function photonCircuitBreaker(instanceUrl: string, failoverConfiguration: FailoverConfiguration): IPolicy {
  if (!circuitBreakerSingletonPerInstanceUrl[instanceUrl]) {
    circuitBreakerSingletonPerInstanceUrl[instanceUrl] = initializeCircuitBreaker(failoverConfiguration);
  }
  return circuitBreakerSingletonPerInstanceUrl[instanceUrl];
}
