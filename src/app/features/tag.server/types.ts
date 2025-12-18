import type { LucideIcon } from "lucide-react";

export const DEFAULT_TAG_CONFIGURATION: RestaurantTagConfiguration = {
  hiddenTags: [
    "restaurant",
    "establishment",
    "point_of_interest",
    "food",
  ],
  maxTags: 5,
  priorityTags: []
};

export interface RestaurantTagConfiguration {
  hiddenTags: string[];
  maxTags: number;
  priorityTags: string[];
}

export interface RestaurantTagDisplay {
  id: string;
  label: string;
}
