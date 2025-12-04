import type { DistanceRange } from "./distance";
import { areLocationEquals, createDeviceLocation, type Coordinates, type LocationPreference } from "./location";
import type { ServicePreference } from "./service";

export class Preference {
  readonly id: string;
  constructor(readonly service: ServicePreference,
              readonly location: LocationPreference,
              readonly range: DistanceRange) {
    this.id = crypto.randomUUID();
  }

  withService(service: ServicePreference): Preference | this {
    if (this.service !== service && this.service?.id !== service?.id) {
      return new Preference(
        service,
        this.location,
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
        this.range
      );
    } else {
      return this;
    }
  }

  withRange(range: DistanceRange): Preference | this {
    if (this.range !== range && this.range?.id !== range?.id) {
      return new Preference(
        this.service,
        this.location,
        range
      );
    } else {
      return this;
    }
  }

  equals(other: Preference): boolean {
    return other && this.id === other.id;
  }
}

export function createDefaultPreference(services: ServicePreference[],
                                        ranges: DistanceRange[],
                                        coordinates: Coordinates | null): Preference {
  return new Preference(
    services[0],
    createDeviceLocation(coordinates),
    ranges[1]
  );
}
