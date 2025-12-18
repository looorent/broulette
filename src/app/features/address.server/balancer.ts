import { LoadBalancer } from "@features/balancer.server";
import type { LocationSuggestions } from "@features/search";
import { registeredProviders } from "./providers";

const LOAD_BALANCER = new LoadBalancer(registeredProviders);

export async function searchLocations(
  query: string,
  signal?: AbortSignal | undefined
): Promise<LocationSuggestions> {
  return LOAD_BALANCER.execute(query, signal);
}
