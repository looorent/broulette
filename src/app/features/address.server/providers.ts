import { LoadBalancer, type ServiceStrategy } from "@features/balancer.server";
import { fetchLocationFromNominatim, type NominatimConfiguration } from "@features/nominatim.server";
import { fetchLocationFromPhoton, type PhotonConfiguration } from "@features/photon.server";
import type { LocationSuggestions } from "@features/search";

let LOAD_BALANCER: LoadBalancer<[string, AbortSignal?], LocationSuggestions>;
function loadBalancer(
  nominatim: NominatimConfiguration | undefined,
  photon: PhotonConfiguration | undefined
) {
  if (!LOAD_BALANCER) {
    LOAD_BALANCER = new LoadBalancer<[string, AbortSignal?], LocationSuggestions>([
      ...registerNominatim(nominatim),
      ...registerPhoton(photon)
    ]);
  }
  return LOAD_BALANCER;
}

export async function searchLocations(
  query: string,
  nominatim: NominatimConfiguration | undefined,
  photon: NominatimConfiguration | undefined,
  signal?: AbortSignal | undefined
): Promise<LocationSuggestions> {
  return loadBalancer(nominatim, photon).execute(query, signal);
}

function registerNominatim(configuration: NominatimConfiguration | undefined): ServiceStrategy<[string, AbortSignal?], LocationSuggestions>[]  {
  if (configuration?.enabled) {
    return configuration.instanceUrls
      .map(instanceUrl => ({
        name: `nominatim:${instanceUrl}`,
        execute: (query: string, signal?: AbortSignal | undefined): Promise<LocationSuggestions> => fetchLocationFromNominatim(query, instanceUrl, configuration, signal)
      }));
  } else {
    return [];
  }
}

function registerPhoton(configuration: PhotonConfiguration | undefined) {
  if (configuration?.enabled) {
    return configuration.instanceUrls
      .map(instanceUrl => ({
        name: `photon:${instanceUrl}`,
        execute: (query: string, signal?: AbortSignal | undefined): Promise<LocationSuggestions> => fetchLocationFromPhoton(query, instanceUrl, configuration, signal)
      }));
  } else {
    return [];
  }
}
