import { noop, type IPolicy } from "cockatiel";

import { initializeCircuitBreaker, type FailoverConfiguration } from "@features/circuit-breaker.server";


const circuitBreakerSingletonPerInstanceUrl: { [instanceUrl: string]: IPolicy } = {};
let failoverConfiguration: FailoverConfiguration | null;

export function initializePhoton(configuration: FailoverConfiguration) {
  if (!configuration) {
    if (failoverConfiguration) {
      console.warn("Photon is already configured. Skip this operation.");
    } else {
      failoverConfiguration = configuration;
    }
  }
}

export function photonCircuitBreaker(instanceUrl: string): IPolicy {
  if (!failoverConfiguration) {
    return noop;
  } else if (circuitBreakerSingletonPerInstanceUrl[instanceUrl]) {
    return circuitBreakerSingletonPerInstanceUrl[instanceUrl];
  } else {
    circuitBreakerSingletonPerInstanceUrl[instanceUrl] = initializeCircuitBreaker(failoverConfiguration);
    return circuitBreakerSingletonPerInstanceUrl[instanceUrl];
  }
}
