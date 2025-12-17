// TODO rename "PhotonConfiguration" ?

export const DEFAULT_PHOTON_CONFIGURATION: GeocodingPhotonConfiguration = {
  instanceUrls: ["https://photon.komoot.io/api/"],
  bottomNote: "by Photon",
  maxNumberOfAddresses: 5
}

export interface GeocodingPhotonConfiguration {
  instanceUrls: string[];
  bottomNote: string;
  maxNumberOfAddresses: number;
}
