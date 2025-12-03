export interface Coordinates {
  latitude: number;
  longitude: number;
}

export class LocationPreference {
  constructor(readonly label: {
      display: string;
      compact: string;
    },
    readonly coordinates: Coordinates | null,
    readonly isDeviceLocation: boolean) {}

  equals(other: LocationPreference): boolean {
    return other !== null && other !== undefined
      && this.coordinates?.latitude === other?.coordinates?.latitude
      && this.coordinates?.longitude === other?.coordinates?.longitude;
  }

  hasCoordinates(): boolean {
    return this.coordinates !== null && this.coordinates !== undefined;
  }
}

export function createDeviceLocation(coordinates: Coordinates | null): LocationPreference {
  return new LocationPreference(
    {
      display: "Current position",
      compact: "Near You"
    },
    coordinates,
    true
  );
}

export const COMMON_LOCATIONS: LocationPreference[] = [
  new LocationPreference(
    {
      display: "San Francisco, CA",
      compact: "San Francisco"
    },
    {
      latitude: 37.7749,
      longitude: -122.4194
    },
    false
  ),
  new LocationPreference(
    {
      display: "Santa Monica, CA",
      compact: "Santa Monica"
    },
    {
      latitude: 34.0195,
      longitude: -118.4912
    },
    false
  ),
  new LocationPreference(
    {
      display: "New York, NY",
      compact: "New York"
    },
    {
      latitude: 40.7128,
      longitude: -74.0060
    },
    false
  ),
  new LocationPreference(
    {
      display: "London, UK",
      compact: "London"
    },
    {
      latitude: 51.5074,
      longitude: -0.1278
    },
    false
  ),
  new LocationPreference({
      display: "Paris, France",
      compact: "Paris"
    },
    {
      latitude: 48.8566,
      longitude: 2.3522
    },
    false
  )
];
