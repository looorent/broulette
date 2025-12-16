import type { FailoverConfiguration } from "@features/circuit-breaker.server/types";

export interface GeocodingPhotonConfiguration {
  baseUrl: string;
  bottomNote: string;
  maxNumberOfAddresses: number;
  failover: FailoverConfiguration;
}
