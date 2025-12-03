export interface DistanceRange {
  id: string;
  label: {
    display: string;
    compact: string;
  };
}

export const RANGES: DistanceRange[] = [
  {
    id: "close",
    label: {
      display: "Close",
      compact: "Close"
    }
  },
  {
    id: "mid_range",
    label: {
      display: "Mid-range",
      compact: "Locally"
    }
  },
  {
    id: "far",
    label: {
      display: "Far",
      compact: "Far"
    }
  }
];
