import type { Coordinates } from "@features/coordinate";
import type { DistanceRangeOption } from "./distance";
import { areLocationEquals, createDeviceLocation, hasCoordinates, type LocationPreference } from "./location";
import type { ServicePreference } from "./service";

export function equalsPreferences(preference: Preference, other: Preference): boolean {
  return preference && other && preference.id === other.id
}

function buildPreference(
  service: ServicePreference,
  location: LocationPreference,
  isDeviceLocationAttempted: boolean,
  range: DistanceRangeOption): Preference {

  const hasValidLocation = hasCoordinates(location);
  const isValid = service && range && hasValidLocation;

  return {
    id: crypto.randomUUID(),
    service: service,
    location: location,
    isDeviceLocationAttempted: isDeviceLocationAttempted,
    range: range,
    isValid: isValid,
    hasValidLocation
  };
}

export interface Preference {
  id: string;
  service: ServicePreference;
  location: LocationPreference;
  isDeviceLocationAttempted: boolean;
  range: DistanceRangeOption;
  isValid: boolean;
  hasValidLocation: boolean;
}

export const preferenceFactory = {
  withLocation: (preference: Preference, location: LocationPreference) => {
    if (preference.location !== location && !areLocationEquals(preference.location, location)) {
      return buildPreference(
        preference.service,
        location,
        preference.isDeviceLocationAttempted,
        preference.range
      );
    } else {
      return preference;
    }
  },

  withService: (preference: Preference, service: ServicePreference) => {
    if (preference.service !== service && preference.service?.id !== service?.id) {
      return buildPreference(
        service,
        preference.location,
        preference.isDeviceLocationAttempted,
        preference.range
      );
    } else {
      return preference;
    }
  },

  withDeviceLocationAttempted: (preference: Preference) => {
    if (preference.isDeviceLocationAttempted) {
      return preference;
    } else {
      return buildPreference(
        preference.service,
        preference.location,
        true,
        preference.range
      );
    }
  },

  withRange: (preference: Preference, range: DistanceRangeOption) => {
    if (preference.range !== range && preference.range?.id !== range?.id) {
      return buildPreference(
        preference.service,
        preference.location,
        preference.isDeviceLocationAttempted,
        range
      );
    } else {
      return preference;
    }
  },

  createDefaultPreference: (services: ServicePreference[], ranges: DistanceRangeOption[], coordinates: Coordinates | null) => {
    return buildPreference(
      services[0],
      createDeviceLocation(coordinates),
      false,
      ranges[1]
    );
  }
};
