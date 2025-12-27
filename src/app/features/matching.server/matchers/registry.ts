import type { GooglePlaceConfiguration } from "@features/google.server";
import type { TripAdvisorConfiguration } from "@features/tripadvisor.server";

import { GoogleMatcher } from "./google";
import { TripAdvisorMatcher } from "./tripadvisor";
import type { Matcher } from "./types";

let MATCHERS: Matcher[] | null = null;
export function registeredMatchers(
  google: GooglePlaceConfiguration | undefined,
  tripAdvisor: TripAdvisorConfiguration | undefined
): Matcher[] {
  if (!MATCHERS) {
    MATCHERS = [
      google?.enabled ? new GoogleMatcher(google) : undefined,
      tripAdvisor?.enabled ? new TripAdvisorMatcher(tripAdvisor) : undefined
    ].filter(Boolean).map(matcher => matcher!);
  }
  return MATCHERS;
}
