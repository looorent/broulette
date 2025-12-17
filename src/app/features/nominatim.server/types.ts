// TODO rename "NominatimConfiguration" ?

export const DEFAULT_CONFIGURATION: GeocodingNominatimConfiguration = {
  instanceUrls: ["https://nominatim.openstreetmap.org/search"],
  userAgent: "Any/App",
  bottomNote: "by OpenStreetMap",
  maxNumberOfAddresses: 5
}

export interface GeocodingNominatimConfiguration {
  instanceUrls: string[];
  userAgent: string;
  maxNumberOfAddresses: number;
  bottomNote: string;
}
