import type { GooglePlaceConfiguration } from "@features/google.server";
import type { TripAdvisorConfiguration } from "@features/tripadvisor.server";

import { GoogleMatcher } from "./google";
import { TripAdvisorMatcher } from "./tripadvisor";
import type { Matcher } from "./types";

export const registeredMatchers: Matcher[] = [];

export function registerGooglePlace(configuration: GooglePlaceConfiguration | undefined) {
  if (configuration) {
    registeredMatchers.push(new GoogleMatcher(configuration));
  }
}

export function registerTripAdvisor(configuration: TripAdvisorConfiguration | undefined) {
  if (configuration) {
    registeredMatchers.push(new TripAdvisorMatcher(configuration));
  }
}
