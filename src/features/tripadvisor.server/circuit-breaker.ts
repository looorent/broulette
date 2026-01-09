import { initializeCircuitBreaker, type CircuitBreaker, type FailoverConfiguration } from "@features/circuit-breaker.server";

let circuitBreakerSingleton: CircuitBreaker | null = null;

export async function tripAdvisorCircuitBreaker(failoverConfiguration: FailoverConfiguration): Promise<CircuitBreaker> {
  if (!circuitBreakerSingleton) {
    circuitBreakerSingleton = await initializeCircuitBreaker("tripadvisor", failoverConfiguration);
  }
  return circuitBreakerSingleton;
}
