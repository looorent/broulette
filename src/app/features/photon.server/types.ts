export const DEFAULT_PHOTON_CONFIGURATION: PhotonConfiguration = {
  enabled: true,
  instanceUrls: ["https://photon.komoot.io/api/"],
  bottomNote: "by Photon",
  maxNumberOfAddresses: 5
}

export interface PhotonConfiguration {
  enabled: boolean;
  instanceUrls: string[];
  bottomNote: string;
  maxNumberOfAddresses: number;
}
