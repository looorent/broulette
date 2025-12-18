export const DEFAULT_NOMINATIM_CONFIGURATION: NominatimConfiguration = {
  enabled: true,
  instanceUrls: [
    "https://nominatim.openstreetmap.org/search"
  ],
  userAgent: "Any/App",
  bottomNote: "by OpenStreetMap",
  maxNumberOfAddresses: 5
}

export interface NominatimConfiguration {
  enabled: boolean;
  instanceUrls: string[];
  userAgent: string;
  maxNumberOfAddresses: number;
  bottomNote: string;
}
