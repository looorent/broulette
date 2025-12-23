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
  candidate: Prisma.SearchCandidateGetPayload<{ include: { search: true, restaurant: { include: { profiles: true }} }}> | undefined | null,
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
    rating: buildRating(profiles),
    tags: buildTags(profiles),
    phoneNumber: buildPhoneNumber(profiles),
    internationalPhoneNumber: buildInternationalPhoneNumber(profiles),
    openingHoursOfTheDay: buildOpeningHoursOfTheDay(search, profiles, locale),
    address: buildAddress(profiles),
    urls: buildUrls(profiles),
    mapUrl: buildMapUrl(restaurant, profiles)
  };
}

function buildSource({ overpass, tripAdvisor, google }: RestaurantProfiles): string  {
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

// TODO should we compute the average
function buildRating({ overpass, tripAdvisor, google }: RestaurantProfiles): string | undefined {
  return (tripAdvisor?.rating || google?.rating || overpass?.rating)?.toFixed(1) || undefined;
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

// TODO is it required to add the Google source url? it is usually the same than the mapUrl
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

// TODO use locale
function formatSearchLabel(serviceTimeslot: ServiceTimeslot, serviceInstant: Date, distanceRange: DistanceRange, locale: string): string {
  return [
    formatServiceTime(serviceTimeslot, serviceInstant),
    formatDistance(distanceRange)
  ].filter(Boolean).join(" - ");
}

// TODO use locale
function formatCandidateLabel({ name }: Restaurant, search: Search, locale: string): string {
  return `${formatSearchLabel(search.serviceTimeslot, search.serviceInstant, search.distanceRange, locale)} - ${name}`;
}

function formatServiceTime(serviceTimeslot: ServiceTimeslot, serviceInstant: Date): string {
  if (serviceTimeslot === ServiceTimeslot.RightNow) {
    return formatMonthDatetime(serviceInstant);
  } else {
    return `${formatMonthDate(serviceInstant)} ${formatDayService(serviceTimeslot)}`;
  }
}

function formatDayService(serviceTimeslot: ServiceTimeslot): string | undefined {
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
function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

function formatMonthDatetime(instant: Date) {
  const day = pad2(instant.getDate());
  const month = pad2(instant.getMonth() + 1);
  const hours = pad2(instant.getHours());
  const mins = pad2(instant.getMinutes());
  return `${day}/${month} ${hours}:${mins}`;
}

function formatMonthDate(instant: Date) {
  const day = pad2(instant.getDate());
  const monthName = instant.toLocaleString("default", { month: "short" });
  return `${day} ${monthName}`;
}

function formatDistance(range: DistanceRange): string | undefined {
  return DISTANCE_RANGES.find(r => r.id === range)?.label?.compact || undefined;
}
