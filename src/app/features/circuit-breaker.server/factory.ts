
import { CircuitBreaker } from "./policy";
import { DEFAULT_FAILOVER, type FailoverConfiguration } from "./types";


export async function initializeCircuitBreaker(
  name: string,
  configuration: FailoverConfiguration = DEFAULT_FAILOVER
): Promise<CircuitBreaker> {
  console.log(
    `[CircuitBreaker] Initializing policies with config: retries=${configuration.retry}, timeout=${configuration.timeoutInMs}ms`
  );

  return new CircuitBreaker(name, configuration);
}
