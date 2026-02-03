import { circuitBreaker } from "@features/circuit-breaker.server";
import type { Coordinates } from "@features/coordinate";
import type { LocationPreference, LocationSuggestions } from "@features/search";
import { logger } from "@features/utils/logger";

import { PhotonError, PhotonHttpError, PhotonServerError } from "./error";
import { DEFAULT_PHOTON_CONFIGURATION, type PhotonConfiguration } from "./types";

interface PhotonFeature {
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    osm_id?: number;
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    state?: string;
    country?: string;
    countrycode?: string;
  };
}

interface PhotonResponse {
  features: PhotonFeature[];
}

const CIRCUIT_BREAKER_NAME_PREFIX = "photon";
export async function fetchLocationFromPhoton(
  query: string,
  instanceUrl: string,
  configuration: PhotonConfiguration = DEFAULT_PHOTON_CONFIGURATION,
  locationBias?: Coordinates | undefined,
  signal?: AbortSignal | undefined
): Promise<LocationSuggestions> {
  logger.log("[Photon] fetchLocationFromPhoton: Processing query='%s' via %s%s", query, instanceUrl, locationBias ? ` with location bias` : "");

  const rawData = await circuitBreaker(`${CIRCUIT_BREAKER_NAME_PREFIX}:${instanceUrl}`, configuration.failover).execute(async combinedSignal => {
    if (combinedSignal?.aborted) {
      throw combinedSignal.reason
    };
    return fetchPhotonAddresses(query, instanceUrl, configuration.maxNumberOfAddresses, locationBias, combinedSignal);
  }, signal);

  const locations = rawData
    .filter(item => item?.geometry?.coordinates?.length === 2)
    .map(convertPhotonToLocation);

  logger.log("[Photon] fetchLocationFromPhoton: Returned %d locations for '%s'", locations.length, query);

  return {
    locations: locations,
    note: configuration.bottomNote
  };
}

async function fetchPhotonAddresses(
  query: string,
  instanceUrl: string,
  maxNumberOfAddresses: number,
  locationBias: Coordinates | undefined,
  signal: AbortSignal | undefined
): Promise<PhotonFeature[]> {
  logger.log("[Photon] fetchPhotonAddresses: Querying API with q='%s'%s...", query, locationBias ? ` near (${locationBias.latitude}, ${locationBias.longitude})` : "");
  const start = Date.now();
  const params = new URLSearchParams({
    q: query,
    limit: maxNumberOfAddresses.toString()
  });

  if (locationBias) {
    params.set("lat", locationBias.latitude.toString());
    params.set("lon", locationBias.longitude.toString());
  }

  const url = `${instanceUrl}?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json"
    },
    signal: signal
  });

  const durationInMs = Date.now() - start;
  if (response.ok) {
    const data: PhotonResponse = await response.json();
    const count = data.features?.length || 0;
    logger.log("[Photon] fetchPhotonAddresses: Success in %dms. Found %d features.", durationInMs, count);
    return data.features || [];
  } else {
    throw await parseError(url, response, durationInMs);
  }
}

function convertPhotonToLocation(feature: PhotonFeature): LocationPreference {
  const { properties, geometry } = feature;
  const primaryName = properties.name || `${properties.street || ''} ${properties.housenumber || ''}`.trim();

  const parts = [
    primaryName,
    properties.city,
    properties.country
  ].filter(Boolean);

  const displayName = parts.join(", ");
  return {
    label: {
      display: displayName || "Unknown Location",
      compact: properties.name || properties.city || displayName
    },
    coordinates: {
      latitude: geometry.coordinates[1],
      longitude: geometry.coordinates[0]
    },
    isDeviceLocation: false
  };
}

async function parseError(url: string, response: Response, durationInMs: number): Promise<PhotonError> {
  const body = await response.text();
  logger.error("[Photon] Request failed after %dms. Status: %d. URL: %s", durationInMs, response.status, url);

  if (response.status >= 500) {
    return new PhotonServerError(
      url,
      response.status,
      body,
      durationInMs
    );
  } else {
    return new PhotonHttpError(
      url,
      response.status,
      body,
      durationInMs
    );
  }
}
