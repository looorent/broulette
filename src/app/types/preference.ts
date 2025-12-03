import type { DistanceRange } from "./distance";
import { createDeviceLocation, type Coordinates, type LocationPreference } from "./location";
import type { ServicePreference } from "./service";

  // TODO for every "with", check the value and returns "this" if there is not difference.
export class Preference {
  readonly id: string;
  constructor(readonly service: ServicePreference,
              readonly location: LocationPreference,
              readonly range: DistanceRange) {
    this.id = crypto.randomUUID();
  }

  withService(service: ServicePreference): Preference {
    return new Preference(
      service,
      this.location,
      this.range
    );
  }

  withLocation(location: LocationPreference): Preference {
    return new Preference(
      this.service,
      location,
      this.range
    );
  }

  withRange(range: DistanceRange): Preference {
    return new Preference(
      this.service,
      this.location,
      range
    );
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
