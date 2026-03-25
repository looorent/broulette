import type { GooglePlaceConfiguration } from "@features/google.server";
import type { ImageUploader } from "@features/image-storage.server";
import type { TripAdvisorConfiguration } from "@features/tripadvisor.server";

import { GoogleMatcher } from "./google";
import { TripAdvisorMatcher } from "./tripadvisor";
import type { Matcher } from "./types";

export function registeredMatchers(
  google: GooglePlaceConfiguration | undefined,
  tripAdvisor: TripAdvisorConfiguration | undefined,
  imageUploader: ImageUploader
): Matcher[] {
  return [
    google?.enabled ? new GoogleMatcher(google, imageUploader) : undefined,
    tripAdvisor?.enabled ? new TripAdvisorMatcher(tripAdvisor, imageUploader) : undefined
  ].filter(Boolean).map(matcher => matcher!);
}
