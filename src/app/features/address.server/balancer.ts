import type { LocationSuggestions } from "@features/search";
import { registeredProviders } from "./registry";
import type { AddressProvider } from "./types";

function findNextIndex(currentIndex: number, offset: number = 0, providers: AddressProvider[]): number {
  return (currentIndex + offset) % providers.length;
}

export async function searchLocations(
  query: string,
  signal?: AbortSignal | undefined
): Promise<LocationSuggestions> {
  const providers = [...registeredProviders];
  let attempts = 0;
  let currentIndex = 0;

  while (attempts < providers.length) {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError"); // TODO is it clean to use "DOMException"?
    }

    const index = findNextIndex(currentIndex, attempts, providers);
    const provider = providers[index];

    try {
      const result = await provider.search(query, signal);
      currentIndex = (index + 1) % providers.length;
      return result;
    } catch (error: any) {
      const isAbort = error.name === "AbortError" || signal?.aborted;

      if (isAbort) {
        console.log('Request aborted by user. Stopping balancer.');
        throw error;
      } else {
        console.warn(`${provider.name} failed. Failover...`);
        attempts++;
      }
    }
  }

  throw new Error("All address providers failed.");
}
