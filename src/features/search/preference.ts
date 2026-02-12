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
  avoidTakeaway: boolean = true,
  onlyHighRated: boolean = false
): Preference {

  const hasValidLocation = hasCoordinates(location);
  const isValid = service && range && hasValidLocation;
  return {
    id: `svc_${service?.id ?? 'null'}_loc_${JSON.stringify(location)}_rng_${range?.id ?? 'null'}_atmpt_${isDeviceLocationAttempted}_aff_${avoidFastFood}_at_${avoidTakeaway}_ohr_${onlyHighRated}`,
    service: service,
    location: location,
    isDeviceLocationAttempted: isDeviceLocationAttempted,
    range: range,
    avoidFastFood: avoidFastFood,
    avoidTakeaway: avoidTakeaway,
    onlyHighRated: onlyHighRated,
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
  onlyHighRated: boolean;
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
        preference.avoidTakeaway,
        preference.onlyHighRated
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
        preference.avoidTakeaway,
        preference.onlyHighRated
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
        preference.avoidTakeaway,
        preference.onlyHighRated
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
        preference.avoidTakeaway,
        preference.onlyHighRated
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
        preference.avoidTakeaway,
        preference.onlyHighRated
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
        avoidTakeaway,
        preference.onlyHighRated
      );
    } else {
      return preference;
    }
  },

  withOnlyHighRated: (preference: Preference, onlyHighRated: boolean) => {
    if (preference.onlyHighRated !== onlyHighRated) {
      return buildPreference(
        preference.service,
        preference.location,
        preference.isDeviceLocationAttempted,
        preference.range,
        preference.avoidFastFood,
        preference.avoidTakeaway,
        onlyHighRated
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
      true,
      false
    );
  },

  createFromStored: (
    stored: {
      distanceRangeId: string;
      avoidFastFood: boolean;
      avoidTakeaway: boolean;
      onlyHighRated: boolean;
      location:
        | { type: "device" }
        | { type: "address"; label: { display: string; compact: string }; coordinates: { latitude: number; longitude: number } };
    },
    services: ServicePreference[],
    ranges: DistanceRangeOption[]
  ) => {
    const range = ranges.find(r => r.id === stored.distanceRangeId) ?? ranges[1];

    const location: LocationPreference = stored.location.type === "device"
      ? createDeviceLocation(null)
      : {
          label: stored.location.label,
          coordinates: stored.location.coordinates,
          isDeviceLocation: false,
        };

    return buildPreference(
      services[1],
      location,
      false,
      range,
      stored.avoidFastFood,
      stored.avoidTakeaway,
      stored.onlyHighRated
    );
  }
};
