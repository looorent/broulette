import type { CANDIDATE_STATUSES, DISTANCE_RANGES, restaurantMatchingAttempts, restaurantProfiles, restaurants, searchCandidates, searches, TIMESLOTS } from "./schema";

export type Search = typeof searches.$inferSelect;
export type Restaurant = typeof restaurants.$inferSelect;
export type RestaurantProfile = typeof restaurantProfiles.$inferSelect;
export type SearchCandidate = typeof searchCandidates.$inferSelect;
export type RestaurantMatchingAttempt = typeof restaurantMatchingAttempts.$inferSelect;

export type ServiceTimeslot = (typeof TIMESLOTS)[number];
export const ServiceTimeslot = {
  Dinner: "Dinner",
  Lunch: "Lunch",
  RightNow: "RightNow",
  Custom: "Custom"
};
export type DistanceRange = (typeof DISTANCE_RANGES)[number];
export const DistanceRange = {
  Close: "Close",
  MidRange: "MidRange",
  Far: "Far",
} as const;
export type SearchCandidateStatus = (typeof CANDIDATE_STATUSES)[number];
export const SearchCandidateStatus = {
  Rejected: "Rejected",
  Returned: "Returned",
} as const;

export type SearchAndRestaurantsAndProfiles = Search & {
  candidates: (SearchCandidate & {
    restaurant: (Restaurant & {
      profiles: RestaurantProfile[];
    }) | null;
  })[];
};

export type RestaurantAndProfiles = Restaurant & {
  profiles: RestaurantProfile[];
};

export type CandidateAndRestaurantAndProfileAndSearch = SearchCandidate & {
  search: Search;
  restaurant: (Restaurant & {
    profiles: RestaurantProfile[];
  }) | null;
};

export type RestaurantProfilePayload = typeof restaurantProfiles.$inferInsert;
