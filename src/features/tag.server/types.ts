export const DEFAULT_TAG_CONFIGURATION: RestaurantTagConfiguration = {
  hiddenTags: [
    "restaurant",
    "establishment",
    "point_of_interest",
    "food",
    "restaurant"
  ],
  maxTags: 5,
  priorityTags: []
};

export interface RestaurantTagConfiguration {
  hiddenTags: string[];
  maxTags: number;
  priorityTags: string[];
}
