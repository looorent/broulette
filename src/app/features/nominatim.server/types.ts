import type { FailoverConfiguration } from "@features/circuit-breaker.server/types";

export interface GeocodingNominatimConfiguration {
  baseUrl: string;
  userAgent: string;
  maxNumberOfAddresses: number;
  bottomNote: string;
  failover: FailoverConfiguration;
}
