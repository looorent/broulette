
import { logger } from "@features/utils/logger";

import { CircuitBreaker } from "./policy";
import { DEFAULT_FAILOVER, type FailoverConfiguration } from "./types";


export async function initializeCircuitBreaker(
  name: string,
  configuration: FailoverConfiguration = DEFAULT_FAILOVER
): Promise<CircuitBreaker> {
  logger.log("[CircuitBreaker] Initializing policies with config: retries=%d, timeout=%dms", configuration.retry, configuration.timeoutInMs);
  return new CircuitBreaker(name, configuration);
}
