import { logger } from "@features/utils/logger";

import type { CircuitBreakerCacheOptions } from "./cache";
import { CircuitBreaker } from "./policy";
import { DEFAULT_FAILOVER, type FailoverConfiguration } from "./types";

const circuitBreakers: Map<string, CircuitBreaker> = new Map();

export function circuitBreaker(
  name: string,
  configuration: FailoverConfiguration = DEFAULT_FAILOVER,
  cache?: CircuitBreakerCacheOptions
): CircuitBreaker {
  let breaker = circuitBreakers.get(name);
  if (!breaker) {
    breaker = createCircuitBreaker(name, configuration, cache);
  }
  return breaker.withCache(cache);
}

function createCircuitBreaker(
  name: string,
  configuration: FailoverConfiguration,
  cache?: CircuitBreakerCacheOptions
): CircuitBreaker {
  logger.log("[CircuitBreaker] Creating '%s' with config: retries=%d, timeout=%dms, cache=%s", name, configuration.retry, configuration.timeoutInMs, cache ? "enabled" : "disabled");
  return new CircuitBreaker(name, configuration, cache);
}
