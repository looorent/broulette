import type { LocationSuggestions } from "~/types/location";
import { fetchLocationFromNominatim } from "./nominatim";
import { fetchLocationFromPhoton } from "./photon";

const PROVIDER_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_BACKOFF_MS: 500,
  LIMIT_OF_ITEMS: 5,
  PROVIDER_SWITCH_DELAY_MS: 200
};

interface GeocodingProvider {
  name: string;
  search(query: string, signal: AbortSignal): Promise<LocationSuggestions>;
}

const photonProvider: GeocodingProvider = {
  name: "Photon",
  async search(query: string, signal: AbortSignal): Promise<LocationSuggestions> {
    return fetchLocationFromPhoton(query, PROVIDER_CONFIG.LIMIT_OF_ITEMS, signal);
  },
};

const nominatimProvider: GeocodingProvider = {
  name: "Nominatim",
  async search(query: string, signal: AbortSignal): Promise<LocationSuggestions> {
    return fetchLocationFromNominatim(query, PROVIDER_CONFIG.LIMIT_OF_ITEMS, signal);
  },
};

export async function searchLocations(query: string, signal?: AbortSignal): Promise<LocationSuggestions> {
  const providers = Array(5).fill([photonProvider, nominatimProvider]).flat();
  let lastError: unknown;

  const operationSignal = signal || new AbortController().signal;

  for (const provider of providers) {
    if (operationSignal.aborted) {
      throw new Error("Request cancelled by user");
    } else {
      try {
        return await provider.search(query, operationSignal);
      } catch (error) {
        console.warn(`[Geocoding] ${provider.name} provider failed.`, error);
        lastError = error;
        if (provider !== providers[providers.length - 1]) {
          await new Promise(resolve => setTimeout(resolve, PROVIDER_CONFIG.PROVIDER_SWITCH_DELAY_MS));
        }
      }
    }
  }
  throw lastError || new Error("All geocoding providers failed.");
}
