import type { DistanceRangeOption } from "./distance";
import { areLocationEquals, createDeviceLocation, hasCoordinates, type LocationPreference } from "./location";
import type { ServicePreference } from "./service";
import type { Coordinates } from "../coordinate/types";

export class Preference {
  readonly id: string;
  constructor(readonly service: ServicePreference,
              readonly location: LocationPreference,
              readonly isDeviceLocationAttempted: boolean,
              readonly range: DistanceRangeOption) {
    this.id = crypto.randomUUID();
  }

  withService(service: ServicePreference): Preference | this {
    if (this.service !== service && this.service?.id !== service?.id) {
      return new Preference(
        service,
        this.location,
        this.isDeviceLocationAttempted,
        this.range
      );
    } else {
      return this;
    }
  }

  withLocation(location: LocationPreference): Preference | this {
    if (this.location !== location && !areLocationEquals(this.location, location)) {
      return new Preference(
        this.service,
        location,
        this.isDeviceLocationAttempted,
        this.range
      );
    } else {
      return this;
    }
  }

  withRange(range: DistanceRangeOption): Preference | this {
    if (this.range !== range && this.range?.id !== range?.id) {
      return new Preference(
        this.service,
        this.location,
        this.isDeviceLocationAttempted,
        range
      );
    } else {
      return this;
    }
  }

  withDeviceLocationAttempted(): Preference | this {
    if (this.isDeviceLocationAttempted) {
      return this;
    } else {
      return new Preference(
        this.service,
        this.location,
        true,
        this.range
      );
    }
  }

  equals(other: Preference): boolean {
    return other && this.id === other.id;
  }

  hasValidLocation(): boolean {
    return hasCoordinates(this.location);
  }

  isValid(): boolean {
    return this.service && this.range && this.hasValidLocation();
  }
}

export function createDefaultPreference(services: ServicePreference[],
                                        ranges: DistanceRangeOption[],
                                        coordinates: Coordinates | null): Preference {
  return new Preference(
    services[0],
    createDeviceLocation(coordinates),
    false,
    ranges[1]
  );
}
