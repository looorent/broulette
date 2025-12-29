import { initializeCircuitBreaker, type CircuitBreaker, type FailoverConfiguration } from "@features/circuit-breaker.server";

let circuitBreakerSingleton: CircuitBreaker | null = null;

export async function googleCircuitBreaker(failoverConfiguration: FailoverConfiguration): Promise<CircuitBreaker> {
  if (!circuitBreakerSingleton) {
    circuitBreakerSingleton = await initializeCircuitBreaker("google", failoverConfiguration);
  }
  return circuitBreakerSingleton;
}
