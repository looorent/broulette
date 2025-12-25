import type { TagView } from "@features/tag";

export interface RestaurantView {
  id: string;
  name: string;
  description: string | undefined;
  priceRange: string | undefined;
  imageUrl: string;
  source: string;
  rating: {
    score: number;
    numberOfVotes: number | undefined;
    label: string;
  } | undefined;
  tags: TagView[];
  phoneNumber: string | undefined;
  internationalPhoneNumber: string | undefined;
  openingHoursOfTheDay: OpeningHoursOfTheDay | undefined;
  address: string | undefined;
  urls: string[];
  mapUrl: string | undefined;
}

export interface SearchView {
  id: string;
  label: string;
  redirectRequired: false;
}

export interface CandidateView {
  label: string;
  redirectRequired: false;
  candidate: {
    id: string;
    rejected: boolean;
  };
  reRollEnabled: boolean;
  search: SearchView;
  restaurant: RestaurantView | undefined;
}

export interface SearchRedirect {
  redirectRequired: true;
  searchId: string;
  latestCandidateId: string;
}

export interface CandidateRedirect {
  redirectRequired: true;
  searchId: string;
  candidateId: string;
}

export interface OpeningHoursOfTheDay {
  unknown: boolean;
  dayLabel: string;
  open: boolean | undefined;
  hoursLabel?: string | undefined;
}
