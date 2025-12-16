import { PHOTON_CONFIG } from "@config/server";
import { createCircuitBreaker } from "@features/circuit-breaker.server";
import { executeRequest } from "@features/http.server";
import type { LocationPreference, LocationSuggestions } from "@features/search";
import { PhotonHttpError, PhotonServerError } from "./error";

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

export async function fetchLocationFromPhoton(query: string, limit: number, signal: AbortSignal): Promise<LocationSuggestions> {
  const rawData = await createCircuitBreaker(() => fetchPhotonAddresses(query, limit, signal));

  const locations = rawData
    .filter((item) => item?.geometry?.coordinates?.length === 2)
    .map(convertPhotonToLocation);

  return {
    locations: locations,
    note: PHOTON_CONFIG.BOTTOM_NOTE
  };
}

async function fetchPhotonAddresses(query: string, limit: number, signal: AbortSignal): Promise<PhotonFeature[]> {
  const params = new URLSearchParams({
    q: query,
    limit: limit.toString()
  });

  const url = `${PHOTON_CONFIG.BASE_URL}?${params.toString()}`;
  const response = await executeRequest(url, {
    headers: {
      "Accept": "application/json"
    }
  },
    PHOTON_CONFIG.TIMEOUT_IN_MS,
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
