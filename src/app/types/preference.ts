import type { DistanceRange } from "./distance";
import { createDeviceLocation, type Coordinates, type LocationPreference } from "./location";
import type { ServicePreference } from "./service";

export class Preference {
  constructor(readonly service: ServicePreference,
              readonly location: LocationPreference,
              readonly range: DistanceRange) {}

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
