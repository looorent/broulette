import { LoadBalancer } from "@features/balancer.server";
import type { LocationSuggestions } from "@features/search";

import { fetchLocationFromNominatim, type NominatimConfiguration } from "@features/nominatim.server";
import { fetchLocationFromPhoton, type PhotonConfiguration } from "@features/photon.server";

const LOAD_BALANCER = new LoadBalancer<[string, AbortSignal?], LocationSuggestions>();

export async function searchLocations(
  query: string,
  signal?: AbortSignal | undefined
): Promise<LocationSuggestions> {
  return LOAD_BALANCER.execute(query, signal);
}

export function registerNominatim(configuration: NominatimConfiguration | undefined) {
  if (configuration) {
    configuration.instanceUrls
      .map(instanceUrl => ({
        name: `nominatim:${instanceUrl}`,
        execute: (query: string, signal?: AbortSignal | undefined): Promise<LocationSuggestions> => fetchLocationFromNominatim(query, instanceUrl, configuration, signal)
      }))
      .forEach(provider => LOAD_BALANCER.addProvider(provider));
  }
}

export function registerPhoton(configuration: PhotonConfiguration | undefined) {
  if (configuration) {
    configuration.instanceUrls
      .map(instanceUrl => ({
        name: `photon:${instanceUrl}`,
        execute: (query: string, signal?: AbortSignal | undefined): Promise<LocationSuggestions> => fetchLocationFromPhoton(query, instanceUrl, configuration, signal)
      }))
      .forEach(provider => LOAD_BALANCER.addProvider(provider));
  }
}
