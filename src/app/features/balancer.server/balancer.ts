import type { ServiceStrategy } from "./types";

export class LoadBalancer<TArgs extends any[], TResult> {
  private providers: ServiceStrategy<TArgs, TResult>[];
  private currentOffset: number = 0;

  constructor(providers: ServiceStrategy<TArgs, TResult>[]) {
    if (providers.length === 0) {
      throw new Error("LoadBalancer must have at least one provider.");
    }
    this.providers = providers;
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
      } catch (error: any) {
        const isAbort = error.name === "AbortError" || signal?.aborted;
        if (isAbort) {
          throw error;
        }
        console.warn(`[Balancer] ${provider.name} failed. Failing over...`);
        attempts++;
      }
    }

    throw new Error("All providers failed.");
  }
}
