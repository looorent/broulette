import { logger } from "@features/utils/logger";

const CACHE_KEY_PREFIX = "circuit-breaker";

export interface CircuitBreakerState {
  failures: number;
  nextAttempt: number;
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
}

export interface CircuitBreakerCacheOptions {
  keyStore: KVNamespace;
  ttlSeconds: number;
}

export const DEFAULT_CIRCUIT_BREAKER_CACHE_TTL_SECONDS = 60;

function buildCacheKey(name: string): string {
  return `${CACHE_KEY_PREFIX}:${name}`;
}

export async function readCircuitBreakerState(
  keyStore: KVNamespace | undefined,
  name: string
): Promise<CircuitBreakerState | undefined> {
  if (!keyStore) {
    return undefined;
  }

  const cacheKey = buildCacheKey(name);
  try {
    const cached = await keyStore.get(cacheKey);
    if (cached) {
      const state = JSON.parse(cached) as CircuitBreakerState;
      logger.trace("[CircuitBreaker] Cache hit for '%s': state=%s, failures=%d", name, state.state, state.failures);
      return state;
    }
  } catch (error) {
    logger.warn("[CircuitBreaker] Cache read error for '%s': %s", name, error);
  }
  return undefined;
}

export function writeCircuitBreakerState(
  keyStore: KVNamespace | undefined,
  name: string,
  state: CircuitBreakerState,
  ttlSeconds: number
): void {
  if (keyStore) {
    const cacheKey = buildCacheKey(name);
    keyStore.put(cacheKey, JSON.stringify(state), { expirationTtl: ttlSeconds }).catch(error => {
      logger.warn("[CircuitBreaker] Cache write error for '%s': %s", name, error);
    });
    logger.trace("[CircuitBreaker] Cache write for '%s': state=%s, failures=%d, ttl=%ds", name, state.state, state.failures, ttlSeconds);
  }
}
