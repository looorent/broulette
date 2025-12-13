import type { DistanceRange } from "@persistence/enums";

export interface DistanceRangeOption {
  id: DistanceRange;
  label: {
    display: string;
    compact: string;
  };

}

export const DISTANCE_RANGES: DistanceRangeOption[] = [
  {
    id: DistanceRange.Close,
    label: {
      display: "Close",
      compact: "Close"
    }
  },
  {
    id: DistanceRange.MidRange,
    label: {
      display: "Mid-range",
      compact: "Locally"
    }
  },
  {
    id: DistanceRange.Far,
    label: {
      display: "Far",
      compact: "Far"
    }
  }
];
