
import type { DistanceRange } from "@persistence";

export interface DistanceRangeOption {
  id: DistanceRange;
  label: {
    display: string;
  };
}

export const DISTANCE_RANGES: DistanceRangeOption[] = [
  {
    id: "Close",
    label: {
      display: "By foot"
    }
  },
  {
    id: "MidRange",
    label: {
      display: "Drive"
    }
  },
  {
    id: "Far",
    label: {
      display: "Adventure"
    }
  }
];

