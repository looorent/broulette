export interface DistanceRange {
  id: string;
  label: {
    display: string;
    compact: string;
  };
}

export const RANGES: DistanceRange[] = [
  {
    id: "Close",
    label: {
      display: "Close",
      compact: "Close"
    }
  },
  {
    id: "MidRange",
    label: {
      display: "Mid-range",
      compact: "Locally"
    }
  },
  {
    id: "Far",
    label: {
      display: "Far",
      compact: "Far"
    }
  }
];
