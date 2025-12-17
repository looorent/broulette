import type { LocationPreference, LocationSuggestions } from "@features/search";
import { photonCircuitBreaker } from "./circuit-breaker";
import { PhotonHttpError, PhotonServerError } from "./error";
import { DEFAULT_PHOTON_CONFIGURATION, type GeocodingPhotonConfiguration } from "./types";

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
  configuration: GeocodingPhotonConfiguration = DEFAULT_PHOTON_CONFIGURATION,
  signal?: AbortSignal | undefined
): Promise<LocationSuggestions> {
  const rawData = await photonCircuitBreaker(instanceUrl).execute(async ({ signal: combinedSignal }) => {
    if (signal?.aborted) {
      throw signal.reason
    };
    return fetchPhotonAddresses(query, instanceUrl, configuration.maxNumberOfAddresses, combinedSignal);
  }, signal);

  const locations = rawData
    .filter(item => item?.geometry?.coordinates?.length === 2)
    .map(convertPhotonToLocation);

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

  if (response.ok) {
    const data: PhotonResponse = await response.json();
    return data.features || [];
  } else if (response.status >= 500) {
    throw new PhotonServerError(response.status);
  } else {
    throw new PhotonHttpError(response.status);
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

  const displayName = parts.join(', ');
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
