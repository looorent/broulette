import type { GeocodingNominatimConfiguration } from "@features/nominatim.server";
import type { GeocodingPhotonConfiguration } from "@features/photon.server";

export interface GeocodingProviderConfiguration {
  providerSwitchDelay: number;
  photon?: GeocodingPhotonConfiguration;
  nominatim?: GeocodingNominatimConfiguration;
}
