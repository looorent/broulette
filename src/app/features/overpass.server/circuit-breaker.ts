import { initializeCircuitBreaker, type FailoverConfiguration } from "@features/circuit-breaker.server";
import { noop, type IPolicy } from "cockatiel";

const circuitBreakerSingletonPerInstanceUrl: { [instanceUrl: string]: IPolicy } = {};
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

export function overpassCircuitBreaker(instanceUrl: string): IPolicy {
  if (!failoverConfiguration) {
    return noop;
  } else if (circuitBreakerSingletonPerInstanceUrl[instanceUrl]) {
    return circuitBreakerSingletonPerInstanceUrl[instanceUrl];
  } else {
    circuitBreakerSingletonPerInstanceUrl[instanceUrl] = initializeCircuitBreaker(failoverConfiguration);
    return circuitBreakerSingletonPerInstanceUrl[instanceUrl];
  }
}
