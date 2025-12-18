import type { ServiceStrategy } from "@features/balancer.server";
import { fetchLocationFromNominatim, type NominatimConfiguration } from "@features/nominatim.server";
import { fetchLocationFromPhoton, type PhotonConfiguration } from "@features/photon.server";
import type { LocationSuggestions } from "@features/search";

export const registeredProviders: ServiceStrategy<[string, AbortSignal?], LocationSuggestions>[] = [];

export function registerNominatim(configuration: NominatimConfiguration | undefined) {
  if (configuration) {
    configuration.instanceUrls
      .map(instanceUrl => ({
        name: `nominatim:${instanceUrl}`,
        execute: (query: string, signal?: AbortSignal | undefined): Promise<LocationSuggestions> => fetchLocationFromNominatim(query, instanceUrl, configuration, signal)
      }))
      .forEach(provider => registeredProviders.push(provider));
  }
}

export function registerPhoton(configuration: PhotonConfiguration | undefined) {
  if (configuration) {
    configuration.instanceUrls
      .map(instanceUrl => ({
        name: `photon:${instanceUrl}`,
        execute: (query: string, signal?: AbortSignal | undefined): Promise<LocationSuggestions> => fetchLocationFromPhoton(query, instanceUrl, configuration, signal)
      }))
      .forEach(provider => registeredProviders.push(provider));
  }
}
