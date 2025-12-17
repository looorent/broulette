import { fetchLocationFromNominatim, type GeocodingNominatimConfiguration } from "@features/nominatim.server";
import { fetchLocationFromPhoton, type GeocodingPhotonConfiguration } from "@features/photon.server";
import type { LocationSuggestions } from "@features/search";

export interface AddressProvider {
  id: string;
  name: string;
  search(query: string, signal?: AbortSignal | undefined): Promise<LocationSuggestions>;
}

export class NominatimAddressProvider implements AddressProvider {
  readonly name: string = "nominatim";
  constructor(readonly id: string,
              readonly instanceUrl: string,
              readonly configuration: GeocodingNominatimConfiguration) {}

  async search(query: string, signal?: AbortSignal | undefined): Promise<LocationSuggestions> {
    return fetchLocationFromNominatim(query, this.instanceUrl, this.configuration, signal);
  }
}

export class PhotonAddressProvider implements AddressProvider {
  readonly name: string = "nominatim";
  constructor(readonly id: string,
              readonly instanceUrl: string,
              readonly configuration: GeocodingPhotonConfiguration) {}

  async search(query: string, signal?: AbortSignal | undefined): Promise<LocationSuggestions> {
    return fetchLocationFromPhoton(query, this.instanceUrl, this.configuration, signal);
  }
}
