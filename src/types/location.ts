export enum DistanceRange {
  Close = 1,
  MidRange = 2,
  Far = 3
}

export interface LocationPreference {
  label: string;
  address: any;
  nearby: boolean;
}

export function createDistanceRangeLabel(range: DistanceRange): string {
  switch (range) {
    default:
    case DistanceRange.Close:
      return "Close";
    case DistanceRange.MidRange:
      return "Mid-range";
    case DistanceRange.Far:
      return "Far";
  }
}

export function createDefaultLocationPreference(): LocationPreference {
  return {
    label: "Near you",
    address: null,
    nearby: true
  };
}

export function createLocationLabel(location: LocationPreference): string {
  if (location?.nearby) {
    return "Nearby";
  } else if (location.address) {
    return location.address; // TODO
  } else {
    return "ERROR"; // TODO
  }
}
