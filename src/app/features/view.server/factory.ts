import { GOOGLE_PLACE_SOURCE_NAME } from "@features/google.server";
import { OVERPASS_SOURCE_NAME } from "@features/overpass.server";
import { DISTANCE_RANGES } from "@features/search";
import type { TagView } from "@features/tag";
import { tagToLabel } from "@features/tag.server";
import { TRIPADVISOR_SOURCE_NAME } from "@features/tripadvisor.server";
import type { CandidateRedirect, CandidateView, OpeningHoursOfTheDay, RestaurantView, SearchRedirect, SearchView } from "@features/view";
import { ServiceTimeslot, type DistanceRange, type Prisma, type Restaurant, type RestaurantProfile, type Search } from "@persistence/client";

import { formatOpeningHoursFor } from "./opening-hours";

type RestaurantModel = Prisma.RestaurantGetPayload<{ include: { profiles: true } }>;

interface RestaurantProfiles {
  overpass: RestaurantProfile | undefined;
  tripAdvisor: RestaurantProfile | undefined;
  google: RestaurantProfile | undefined;
}

export function buildViewModelOfCandidate(
  candidate: Prisma.SearchCandidateGetPayload<{ include: { search: true, restaurant: { include: { profiles: true } } } }> | undefined | null,
  locale: string,
  now: Date
): CandidateRedirect | CandidateView | undefined {
  if (candidate) {
    const hasExpired = now > candidate.search.serviceEnd;
    return {
      label: formatCandidateLabel(candidate.restaurant, candidate.search, locale),
      redirectRequired: false,
      candidate: {
        id: candidate.id
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
  restaurant: RestaurantModel,
  search: Search,
  locale: string
): RestaurantView {
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
}

function buildSource({ overpass, tripAdvisor, google }: RestaurantProfiles): string {
  return google?.source || tripAdvisor?.source || overpass?.source || OVERPASS_SOURCE_NAME;
}

function buildDescription({ overpass, tripAdvisor, google }: RestaurantProfiles): string | undefined {
  return tripAdvisor?.description || google?.description || overpass?.description || undefined;
}

function buildPriceRange({ overpass, tripAdvisor, google }: RestaurantProfiles): string | undefined {
  return google?.priceLabel || tripAdvisor?.priceLabel || overpass?.priceLabel || undefined;
}

const NO_IMAGE_DEFAULT_URL = "https://placehold.co/600x400?text=No+Image";
function buildImageUrl({ overpass, tripAdvisor, google }: RestaurantProfiles): string {
  return google?.imageUrl || tripAdvisor?.imageUrl || overpass?.imageUrl || NO_IMAGE_DEFAULT_URL;
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
    .map(profile => ({ score: profile.rating!.toNumber(), count: profile.ratingCount }));

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
        numberOfVotes: rating,
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
  return (tripAdvisor?.tags || google?.tags || overpass?.tags || []).map(tagToLabel);
}

function buildPhoneNumber({ overpass, tripAdvisor, google }: RestaurantProfiles): string | undefined {
  return google?.phoneNumber || tripAdvisor?.phoneNumber || overpass?.phoneNumber || undefined;
}

function buildInternationalPhoneNumber({ overpass, tripAdvisor, google }: RestaurantProfiles): string | undefined {
  return google?.internationalPhoneNumber || tripAdvisor?.internationalPhoneNumber || overpass?.internationalPhoneNumber || undefined;
}

function buildOpeningHoursOfTheDay(search: Search, { overpass, tripAdvisor, google }: RestaurantProfiles, locale: string): OpeningHoursOfTheDay | undefined {
  const openingHours = tripAdvisor?.openingHours || google?.openingHours || overpass?.openingHours || undefined;
  if (openingHours) {
    return formatOpeningHoursFor(search.serviceInstant, openingHours, locale);
  } else {
    return undefined;
  }
}

function buildAddress({ overpass, tripAdvisor, google }: RestaurantProfiles): string | undefined {
  return google?.address || tripAdvisor?.address || overpass?.address || undefined;
}

function buildUrls({ tripAdvisor, google, overpass }: RestaurantProfiles): string[] {
  return [
    tripAdvisor?.sourceUrl,
    google?.website || tripAdvisor?.website || overpass?.website
  ].filter(Boolean).map(url => url!);
}

function buildMapUrl(restaurant: RestaurantModel, { tripAdvisor, google }: RestaurantProfiles): string | undefined {
  return google?.mapUrl || tripAdvisor?.mapUrl || createGoogleMapsUrl(restaurant);
}

const GOOGLE_MAP_BASE_URL = "https://www.google.com/maps/search/?api=1";
function createGoogleMapsUrl({ name, latitude, longitude }: {
  name: string | undefined | null;
  latitude: Prisma.Decimal;
  longitude: Prisma.Decimal;
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

function formatCandidateLabel({ name }: Restaurant, search: Search, locale: string): string {
  return `${formatSearchLabel(search.serviceTimeslot, search.serviceInstant, search.distanceRange, locale)} - ${name}`;
}

function formatServiceTime(serviceTimeslot: ServiceTimeslot, serviceInstant: Date, locale: string): string {
  if (serviceTimeslot === ServiceTimeslot.RightNow) {
    return formatMonthDatetime(serviceInstant, locale);
  } else {
    return `${formatMonthDate(serviceInstant, locale)} ${formatDayService(serviceTimeslot, locale)}`;
  }
}

function formatDayService(serviceTimeslot: ServiceTimeslot, _locale: string): string | undefined {
  switch (serviceTimeslot) {
    case ServiceTimeslot.Dinner:
      return "Dinner";
    case ServiceTimeslot.Lunch:
      return "Lunch";
    case ServiceTimeslot.RightNow:
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
  return DISTANCE_RANGES.find(r => r.id === range)?.label?.compact || undefined;
}
