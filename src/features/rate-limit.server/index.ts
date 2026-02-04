export interface RateLimitConfiguration {
  limit: number;
  windowSeconds: number;
}

export const DEFAULT_RATE_LIMIT_CONFIGURATION: RateLimitConfiguration = {
  limit: 30,
  windowSeconds: 60
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export async function checkRateLimit(
  kv: KVNamespace,
  key: string,
  config: RateLimitConfiguration
): Promise<RateLimitResult> {
  const current = await kv.get(key);
  const count = current ? parseInt(current, 10) : 0;

  if (count >= config.limit) {
    return { allowed: false, remaining: 0 };
  }

  await kv.put(key, (count + 1).toString(), { expirationTtl: config.windowSeconds });

  return { allowed: true, remaining: config.limit - count - 1 };
}
