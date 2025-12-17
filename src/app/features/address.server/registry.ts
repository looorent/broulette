import type { GeocodingNominatimConfiguration } from "@features/nominatim.server";
import { NominatimAddressProvider, PhotonAddressProvider, type AddressProvider } from "./types";
import type { GeocodingPhotonConfiguration } from "@features/photon.server";

export const registeredProviders: AddressProvider[] = [];
export function registerNominatim(configuration: GeocodingNominatimConfiguration) {
  if (configuration) {
    configuration.instanceUrls
      .map(instanceUrl => new NominatimAddressProvider(`nominatim:${instanceUrl}`, instanceUrl, configuration))
      .forEach(provider => registeredProviders.push(provider));
  }
}

export function registerPhoton(configuration: GeocodingPhotonConfiguration) {
  if (configuration) {
    configuration.instanceUrls
      .map(instanceUrl => new PhotonAddressProvider(`photon:${instanceUrl}`, instanceUrl, configuration))
      .forEach(provider => registeredProviders.push(provider));
  }
}
