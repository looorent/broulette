
import { GOOGLE_PLACE_SOURCE_NAME } from "@features/google.server";
import { OVERPASS_SOURCE_NAME } from "@features/overpass.server";
import { DISTANCE_RANGES } from "@features/search";
import type { TagView } from "@features/tag";
import { tagToLabel } from "@features/tag.server";
import { TRIPADVISOR_SOURCE_NAME } from "@features/tripadvisor.server";
import type { CandidateRedirect, CandidateView, OpeningHoursOfTheDay, RestaurantView, SearchRedirect, SearchView } from "@features/view";
import type { CandidateAndRestaurantAndProfileAndSearch, DistanceRange, Restaurant, RestaurantAndProfiles, RestaurantProfile, Search, ServiceTimeslot } from "@persistence";

import { formatOpeningHoursFor } from "./opening-hours";

interface RestaurantProfiles {
  overpass: RestaurantProfile | undefined;
  tripAdvisor: RestaurantProfile | undefined;
  google: RestaurantProfile | undefined;
}

export function buildViewModelOfCandidate(
  candidate: CandidateAndRestaurantAndProfileAndSearch | undefined | null,
  locale: string,
  now: Date
): CandidateRedirect | CandidateView | undefined {
  if (candidate) {
    const hasExpired = now > candidate.search.serviceEnd;
    return {
      label: formatCandidateLabel(candidate.restaurant, candidate.search, locale),
      redirectRequired: false,
      candidate: {
        id: candidate.id,
        rejected: candidate.status === "Rejected"
      },
      reRollEnabled: !candidate.search.exhausted && !hasExpired,
      search: {
        id: candidate.search.id,
        label: formatSearchLabel(candidate.search.serviceTimeslot, candidate.search.serviceInstant, candidate.search.distanceRange, locale),
        redirectRequired: false
      },
      restaurant: buildViewModelOfRestaurant(candidate.restaurant, candidate.search, locale)
    };
  } else {
    return undefined;
  }
}

export function buildViewModelOfSearch(search: {
  searchId: string;
  exhausted: boolean;
  serviceTimeslot: ServiceTimeslot;
  serviceInstant: Date;
  distanceRange: DistanceRange;
  latestCandidateId: string | undefined;
} | undefined, locale: string): SearchRedirect | SearchView | undefined {
  if (search) {
    if (search.latestCandidateId) {
      return {
        redirectRequired: true,
        searchId: search.searchId,
        latestCandidateId: search.latestCandidateId
      };
    } else {
      return {
        redirectRequired: false,
        id: search.searchId,
        label: formatSearchLabel(search.serviceTimeslot, search.serviceInstant, search.distanceRange, locale)
      };
    }
  } else {
    return undefined;
  }
}

export function buildViewModelOfRestaurant(
  restaurant: RestaurantAndProfiles | undefined | null,
  search: Search,
  locale: string
): RestaurantView | undefined {
  if (restaurant) {
    const profiles: RestaurantProfiles = {
      overpass: restaurant.profiles.find(profile => profile.source === OVERPASS_SOURCE_NAME),
      tripAdvisor: restaurant.profiles.find(profile => profile.source === TRIPADVISOR_SOURCE_NAME),
      google: restaurant.profiles.find(profile => profile.source === GOOGLE_PLACE_SOURCE_NAME)
    };

    return {
      id: restaurant.id,
      name: restaurant.name || "",
      description: buildDescription(profiles),
      source: buildSource(profiles),
      priceRange: buildPriceRange(profiles),
      imageUrl: buildImageUrl(profiles),
      rating: computeRating(profiles),
      tags: buildTags(profiles),
      phoneNumber: buildPhoneNumber(profiles),
      internationalPhoneNumber: buildInternationalPhoneNumber(profiles),
      openingHoursOfTheDay: buildOpeningHoursOfTheDay(search, profiles, locale),
      address: buildAddress(profiles),
      urls: buildUrls(profiles),
      mapUrl: buildMapUrl(restaurant, profiles)
    };
  } else {
    return undefined;
  }
}

function pickFirst<K extends keyof RestaurantProfile>(
  field: K,
  ...profiles: (RestaurantProfile | undefined)[]
): RestaurantProfile[K] | undefined {
  for (const profile of profiles) {
    if (profile?.[field]) {
      return profile[field];
    }
  }
  return undefined;
}

function buildSource({ overpass, tripAdvisor, google }: RestaurantProfiles): string {
  return pickFirst("source", google, tripAdvisor, overpass) || OVERPASS_SOURCE_NAME;
}

function buildDescription({ overpass, tripAdvisor, google }: RestaurantProfiles): string | undefined {
  return pickFirst("description", tripAdvisor, google, overpass) || undefined;
}

function buildPriceRange({ overpass, tripAdvisor, google }: RestaurantProfiles): string | undefined {
  return pickFirst("priceLabel", google, tripAdvisor, overpass) || undefined;
}

function buildImageUrl({ overpass, tripAdvisor, google }: RestaurantProfiles): string | undefined {
  return pickFirst("imageUrl", google, tripAdvisor, overpass) || undefined;
}

function computeRating(profiles: RestaurantProfiles): {
  score: number;
  numberOfVotes: number | undefined;
  label: string;
} | undefined {
  const ratings = [
    profiles.google,
    profiles.tripAdvisor,
    profiles.overpass
  ].filter(Boolean)
    .map(profile => profile!)
    .filter(profile => profile.rating !== undefined && profile.rating !== null)
    .map(profile => ({ score: profile.rating!, count: profile.ratingCount }));

  if (ratings.length > 0) {
    const { rating, count } = ratings.reduce(
      (total, profile) => {
        const count = profile.count || 0;
        return {
          rating: total.rating + (profile.score * count),
          count: total.count + count,
        };
      },
      { rating: 0, count: 0 }
    );

    if (count > 0) {
      const score = rating / count;
      return {
        score: score,
        numberOfVotes: count,
        label: score.toFixed(1)
      };
    } else {
      const rating = ratings?.[0];
      return {
        score: rating.score,
        numberOfVotes: rating.count || undefined,
        label: rating.score.toFixed(1)
      };
    }
  } else {
    return undefined;
  }
}

function buildTags({ overpass, tripAdvisor, google }: RestaurantProfiles): TagView[] {
  return (pickFirst("tags", tripAdvisor, google, overpass) || []).map(tagToLabel);
}

function buildPhoneNumber({ overpass, tripAdvisor, google }: RestaurantProfiles): string | undefined {
  return pickFirst("phoneNumber", google, tripAdvisor, overpass) || undefined;
}

function buildInternationalPhoneNumber({ overpass, tripAdvisor, google }: RestaurantProfiles): string | undefined {
  return pickFirst("internationalPhoneNumber", google, tripAdvisor, overpass) || undefined;
}

function buildOpeningHoursOfTheDay(search: Search, { overpass, tripAdvisor, google }: RestaurantProfiles, locale: string): OpeningHoursOfTheDay {
  const openingHours = pickFirst("openingHours", tripAdvisor, google, overpass) || undefined;
  return formatOpeningHoursFor(search.serviceInstant, openingHours, locale);
}

function buildAddress({ overpass, tripAdvisor, google }: RestaurantProfiles): string | undefined {
  return pickFirst("address", google, tripAdvisor, overpass) || undefined;
}

function buildUrls({ tripAdvisor, google, overpass }: RestaurantProfiles): string[] {
  const sources = [
    tripAdvisor?.sourceUrl,
    google?.website || tripAdvisor?.website || overpass?.website
  ].filter((url): url is string => !!url);

  const result = sources.reduce(
    (acc, url) => {
      try {
        const hostname = new URL(url).hostname;
        const parts = hostname.split('.');
        const brand = parts.length > 1 ? parts[parts.length - 2] : parts[0];

        if (acc.seenBrands.has(brand)) {
          return acc;
        } else {
          return {
            urls: [...acc.urls, url],
            seenBrands: new Set(acc.seenBrands).add(brand)
          };
        }
      } catch {
        return {
          ...acc,
          urls: [...acc.urls, url]
        };
      }
    },
    { urls: [] as string[], seenBrands: new Set<string>() }
  );

  return result.urls;
}

function buildMapUrl(restaurant: RestaurantAndProfiles, { tripAdvisor, google }: RestaurantProfiles): string | undefined {
  return google?.mapUrl || tripAdvisor?.mapUrl || createGoogleMapsUrl(restaurant);
}

const GOOGLE_MAP_BASE_URL = "https://www.google.com/maps/search/?api=1";
function createGoogleMapsUrl({ name, latitude, longitude }: {
  name: string | undefined | null;
  latitude: number;
  longitude: number;
}): string {
  if (name) {
    const encodedName = encodeURIComponent(name);
    return `${GOOGLE_MAP_BASE_URL}&query=${encodedName}&center=${latitude.toString()},${longitude.toString()}`;
  } else {
    return `${GOOGLE_MAP_BASE_URL}&query=${latitude.toString()},${longitude.toString()}`;
  }
}

function formatSearchLabel(
  serviceTimeslot: ServiceTimeslot,
  serviceInstant: Date,
  distanceRange: DistanceRange,
  locale: string
): string {
  return [
    formatServiceTime(serviceTimeslot, serviceInstant, locale),
    formatDistance(distanceRange)
  ].filter(Boolean).join(" - ");
}

function formatCandidateLabel(restaurant: Restaurant | undefined | null, search: Search, locale: string): string {
  return [
    formatSearchLabel(search.serviceTimeslot, search.serviceInstant, search.distanceRange, locale),
    restaurant?.name
  ].filter(Boolean).join(" - ");
}

function formatServiceTime(serviceTimeslot: ServiceTimeslot, serviceInstant: Date, locale: string): string {
  if (serviceTimeslot === "RightNow") {
    return formatMonthDatetime(serviceInstant, locale);
  } else {
    return `${formatMonthDate(serviceInstant, locale)} ${formatDayService(serviceTimeslot, locale)}`;
  }
}

function formatDayService(serviceTimeslot: ServiceTimeslot, _locale: string): string | undefined {
  switch (serviceTimeslot) {
    case "Dinner":
      return "Dinner";
    case "Lunch":
      return "Lunch";
    case "RightNow":
      return "Right Now";
    default:
      return undefined;
  }
}

function formatMonthDatetime(instant: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(instant);
}

function formatMonthDate(instant: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short"
  }).format(instant);
}

function formatDistance(range: DistanceRange): string | undefined {
  return DISTANCE_RANGES.find(r => r.id === range)?.label?.display || undefined;
}
