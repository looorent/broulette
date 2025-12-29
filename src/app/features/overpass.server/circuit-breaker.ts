
import { initializeCircuitBreaker, type CircuitBreaker, type FailoverConfiguration } from "@features/circuit-breaker.server";

const circuitBreakerSingletonPerInstanceUrl: { [instanceUrl: string]: CircuitBreaker } = {};

export async function overpassCircuitBreaker(instanceUrl: string, failoverConfiguration: FailoverConfiguration): Promise<CircuitBreaker> {
  if (!circuitBreakerSingletonPerInstanceUrl[instanceUrl]) {
    circuitBreakerSingletonPerInstanceUrl[instanceUrl] = await initializeCircuitBreaker(`overpass:${instanceUrl}`, failoverConfiguration);
  }
  return circuitBreakerSingletonPerInstanceUrl[instanceUrl];
}
