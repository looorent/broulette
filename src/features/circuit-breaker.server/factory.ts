import { logger } from "@features/utils/logger";

import { CircuitBreaker } from "./policy";
import { DEFAULT_FAILOVER, type FailoverConfiguration } from "./types";

const circuitBreakers: Map<string, CircuitBreaker> = new Map();

export function circuitBreaker(
  name: string,
  configuration: FailoverConfiguration = DEFAULT_FAILOVER
): CircuitBreaker {
  let breaker = circuitBreakers.get(name);
  if (!breaker) {
    breaker = createCircuitBreaker(name, configuration);
    circuitBreakers.set(name, breaker);
  }
  return breaker;
}

function createCircuitBreaker(
  name: string,
  configuration: FailoverConfiguration
): CircuitBreaker {
  logger.log("[CircuitBreaker] Creating '%s' with config: retries=%d, timeout=%dms", name, configuration.retry, configuration.timeoutInMs);
  return new CircuitBreaker(name, configuration);
}
