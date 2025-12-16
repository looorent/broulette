import { createCircuitBreaker } from "@features/circuit-breaker.server";
import { executeRequest } from "@features/http.server";
import type { LocationPreference, LocationSuggestions } from "@features/search";
import { PhotonHttpError, PhotonServerError } from "./error";
import type { GeocodingPhotonConfiguration } from "./types";

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

export async function fetchLocationFromPhoton(query: string, configuration: GeocodingPhotonConfiguration, signal: AbortSignal): Promise<LocationSuggestions> {
  const rawData = await createCircuitBreaker(
    () => fetchPhotonAddresses(query, configuration, signal),
    configuration.failover.retries,
    configuration.failover.timeoutInMs
  );

  const locations = rawData
    .filter((item) => item?.geometry?.coordinates?.length === 2)
    .map(convertPhotonToLocation);

  return {
    locations: locations,
    note: configuration.bottomNote
  };
}

async function fetchPhotonAddresses(query: string, configuration: GeocodingPhotonConfiguration, signal: AbortSignal): Promise<PhotonFeature[]> {
  const params = new URLSearchParams({
    q: query,
    limit: configuration.maxNumberOfAddresses.toString()
  });
  const url = `${configuration.baseUrl}?${params.toString()}`;
  const response = await executeRequest(url, {
    headers: {
      "Accept": "application/json"
    }
  },
    configuration.timeoutInMs,
    signal
  );

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
