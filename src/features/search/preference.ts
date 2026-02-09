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
  range: DistanceRangeOption,
  avoidFastFood: boolean = true,
  avoidTakeaway: boolean = true
): Preference {

  const hasValidLocation = hasCoordinates(location);
  const isValid = service && range && hasValidLocation;
  return {
    id: `svc_${service?.id ?? 'null'}_loc_${JSON.stringify(location)}_rng_${range?.id ?? 'null'}_atmpt_${isDeviceLocationAttempted}_aff_${avoidFastFood}_at_${avoidTakeaway}`,
    service: service,
    location: location,
    isDeviceLocationAttempted: isDeviceLocationAttempted,
    range: range,
    avoidFastFood: avoidFastFood,
    avoidTakeaway: avoidTakeaway,
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
  avoidFastFood: boolean;
  avoidTakeaway: boolean;
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
        preference.range,
        preference.avoidFastFood,
        preference.avoidTakeaway
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
        preference.range,
        preference.avoidFastFood,
        preference.avoidTakeaway
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
        preference.range,
        preference.avoidFastFood,
        preference.avoidTakeaway
      );
    }
  },

  withRange: (preference: Preference, range: DistanceRangeOption) => {
    if (preference.range !== range && preference.range?.id !== range?.id) {
      return buildPreference(
        preference.service,
        preference.location,
        preference.isDeviceLocationAttempted,
        range,
        preference.avoidFastFood,
        preference.avoidTakeaway
      );
    } else {
      return preference;
    }
  },

  withAvoidFastFood: (preference: Preference, avoidFastFood: boolean) => {
    if (preference.avoidFastFood !== avoidFastFood) {
      return buildPreference(
        preference.service,
        preference.location,
        preference.isDeviceLocationAttempted,
        preference.range,
        avoidFastFood,
        preference.avoidTakeaway
      );
    } else {
      return preference;
    }
  },

  withAvoidTakeaway: (preference: Preference, avoidTakeaway: boolean) => {
    if (preference.avoidTakeaway !== avoidTakeaway) {
      return buildPreference(
        preference.service,
        preference.location,
        preference.isDeviceLocationAttempted,
        preference.range,
        preference.avoidFastFood,
        avoidTakeaway
      );
    } else {
      return preference;
    }
  },

  createDefaultPreference: (services: ServicePreference[], ranges: DistanceRangeOption[], coordinates: Coordinates | null) => {
    return buildPreference(
      services[1],
      createDeviceLocation(coordinates),
      false,
      ranges[1],
      true,
      true
    );
  }
};
