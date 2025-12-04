export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationPreference {
  label: {
    display: string;
    compact: string;
  },
  coordinates: Coordinates | null;
  isDeviceLocation: boolean;
}

export interface LocationSuggestions {
  locations: LocationPreference[];
  note: string | undefined;
}

export function areLocationEquals(location: LocationPreference, otherLocation: LocationPreference): boolean {
  return !location && !otherLocation
    || location && otherLocation
      && location.coordinates?.latitude === otherLocation?.coordinates?.latitude
      && location.coordinates?.longitude === otherLocation?.coordinates?.longitude;
}

export function hasCoordinates(location: LocationPreference): boolean {
  return location?.coordinates !== null && location?.coordinates !== undefined;
}

export function createDeviceLocation(coordinates: Coordinates | null): LocationPreference {
  return {
    label: {
      display: "Current position",
      compact: "Near You"
    },
    coordinates: coordinates ? {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude
    } : null,
    isDeviceLocation: true
  };
}
