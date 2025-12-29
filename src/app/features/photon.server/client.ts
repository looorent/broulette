import type { LocationPreference, LocationSuggestions } from "@features/search";

import { photonCircuitBreaker } from "./circuit-breaker";
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

export async function fetchLocationFromPhoton(
  query: string,
  instanceUrl: string,
  configuration: PhotonConfiguration = DEFAULT_PHOTON_CONFIGURATION,
  signal?: AbortSignal | undefined
): Promise<LocationSuggestions> {
  console.log(`[Photon] fetchLocationFromPhoton: Processing query="${query}" via ${instanceUrl}`);

  const rawData = await (await photonCircuitBreaker(instanceUrl, configuration.failover)).execute(async combinedSignal => {
    if (combinedSignal?.aborted) {
      throw combinedSignal.reason
    };
    return fetchPhotonAddresses(query, instanceUrl, configuration.maxNumberOfAddresses, combinedSignal);
  }, signal);

  const locations = rawData
    .filter(item => item?.geometry?.coordinates?.length === 2)
    .map(convertPhotonToLocation);

  console.log(`[Photon] fetchLocationFromPhoton: Returned ${locations.length} locations for "${query}"`);

  return {
    locations: locations,
    note: configuration.bottomNote
  };
}

async function fetchPhotonAddresses(
  query: string,
  instanceUrl: string,
  maxNumberOfAddresses: number,
  signal: AbortSignal | undefined
): Promise<PhotonFeature[]> {
  console.log(`[Photon] fetchPhotonAddresses: Querying API with q='${query}'...`);
  const start = Date.now();
  const params = new URLSearchParams({
    q: query,
    limit: maxNumberOfAddresses.toString()
  });
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
    console.log(`[Photon] fetchPhotonAddresses: Success in ${durationInMs}ms. Found ${count} features.`);
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
  console.error(`[Photon] Request failed after ${durationInMs}ms. Status: ${response.status}. URL: ${url}`);

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
