import { fetchLocationFromNominatim } from "@features/nominatim.server/client";
import { fetchLocationFromPhoton } from "@features/photon.server/client";
import type { LocationSuggestions } from "@features/search";
import { type GeocodingProviderConfiguration } from "./types";

interface GeocodingProvider {
  name: string;
  search(query: string, configuration: GeocodingProviderConfiguration, signal: AbortSignal): Promise<LocationSuggestions>;
}

const photonProvider: GeocodingProvider = {
  name: "Photon",
  async search(query: string, configuration: GeocodingProviderConfiguration, signal: AbortSignal): Promise<LocationSuggestions> {
    if (configuration?.photon) {
      return fetchLocationFromPhoton(query, configuration?.photon, signal);
    } else {
      return Promise.resolve({
        locations: [],
        note: ""
      });
    }
  }
};

const nominatimProvider: GeocodingProvider = {
  name: "Nominatim",
  async search(query: string, configuration: GeocodingProviderConfiguration, signal: AbortSignal): Promise<LocationSuggestions> {
    if (configuration?.nominatim) {
      return fetchLocationFromNominatim(query, configuration?.nominatim, signal);
    } else {
      return Promise.resolve({
        locations: [],
        note: ""
      });
    }
  }
};

export async function searchLocations(query: string, configuration: GeocodingProviderConfiguration, signal?: AbortSignal): Promise<LocationSuggestions> {
  const providers = [
    configuration.nominatim ? nominatimProvider : null,
    configuration.photon ? photonProvider : null,
  ].filter(Boolean)
  .map(provider => provider!);

  const replicatedProviders = Array(5).fill(providers).flat();
  let lastError: unknown;

  const operationSignal = signal || new AbortController().signal;

  for (const provider of replicatedProviders) {
    if (operationSignal.aborted) {
      throw new Error("Request cancelled by user");
    } else {
      try {
        return await provider.search(query, operationSignal);
      } catch (error) {
        console.warn(`[Geocoding] ${provider.name} provider failed.`, error);
        lastError = error;
        if (provider !== replicatedProviders[replicatedProviders.length - 1]) {
          await new Promise(resolve => setTimeout(resolve, configuration.providerSwitchDelay));
        }
      }
    }
  }
  throw lastError || new Error("All geocoding providers failed.");
}
