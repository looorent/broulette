import { isAbortError } from "@features/utils/error";
import { logger } from "@features/utils/logger";

import type { ServiceStrategy } from "./types";

export class LoadBalancer<TArgs extends unknown[], TResult> {
  private providers: ServiceStrategy<TArgs, TResult>[];
  private currentOffset: number = 0;

  constructor(providers: ServiceStrategy<TArgs, TResult>[] = []) {
    this.providers = [...providers];
  }

  /**
   * Round-Robin with Failover.
   */
  async execute(...args: TArgs): Promise<TResult> {
    const numberOfProviders = this.providers.length;
    let attempts = 0;

    const signal = args.find((arg) => arg instanceof AbortSignal) as AbortSignal | undefined;
    while (attempts < numberOfProviders) {
      if (signal?.aborted) {
        throw new Error("Aborted");
      }

      const index = (this.currentOffset + attempts) % numberOfProviders;
      const provider = this.providers[index];

      try {
        const result = await provider.execute(...args);
        this.currentOffset = (index + 1) % numberOfProviders;
        return result;
      } catch (error: unknown) {
        if (isAbortError(error) || signal?.aborted) {
          throw error;
        }
        logger.warn("[Balancer] %s failed. Failing over... %s", provider.name, error);
        attempts++;
      }
    }

    throw new Error("All providers failed.");
  }

  get numberOfProviders(): number {
    return this.providers.length;
  }
}
