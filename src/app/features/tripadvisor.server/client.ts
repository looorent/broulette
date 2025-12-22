import { tripAdvisorCircuitBreaker } from "./circuit-breaker";
import { TripAdvisorEmptyResponseError, TripAdvisorHttpError, TripAdvisorServerError } from "./error";
import { convertTripAdvisorHoursToOpeningHours } from "./opening-hours";
import { findBestTripAdvisorMatch } from "./similarity";
import { DEFAULT_TRIPADVISOR_CONFIGURATION, type AddressInfo, type Award, type LocalizedName, type LocationHours, type OperatingPeriod, type RankingData, type TripAdvisorConfiguration, type TripAdvisorLocation, type TripAdvisorLocationNearby, type TripType } from "./types";

export async function findTripAdvisorLocationByIdWithRetry(
  locationId: string,
  language: string = "en",
  configuration: TripAdvisorConfiguration = DEFAULT_TRIPADVISOR_CONFIGURATION,
  signal?: AbortSignal | undefined
): Promise<TripAdvisorLocation | undefined> {
  return await tripAdvisorCircuitBreaker().execute(async ({ signal: combinedSignal }) => {
    if (combinedSignal?.aborted) {
      throw combinedSignal.reason;
    }
    return await findTripAdvisorLocationById(locationId, language, configuration, combinedSignal);
  }, signal);
}

async function findTripAdvisorLocationById(
  locationId: string,
  language: string = "en",
  configuration: TripAdvisorConfiguration = DEFAULT_TRIPADVISOR_CONFIGURATION,
  signal?: AbortSignal | undefined
): Promise<TripAdvisorLocation | undefined> {
  console.info(`[TripAdvisor] Finding the location with id='${locationId}'...`);
  const url = buildUrlToFindLocationById(locationId, language, configuration);
  const authenticatedUrl = addAuthenticationOn(url, configuration);
  const start = Date.now();

  const response = await fetch(authenticatedUrl, {
    method: "get",
    signal: signal
  });

  const durationInMs = Date.now() - start;
  if (response.ok) {
    console.info(`[TripAdvisor] Finding the location with id='${locationId}': done in ${durationInMs} ms.`);

    const body = (await response.json()) as any;
    if (body) {
      return parseLocationDetails(body);
    } else {
      throw new TripAdvisorEmptyResponseError(
        url,
        response.status,
        await response.text(),
        durationInMs
      );
    }
  } else if (response.status >= 500) {
    throw new TripAdvisorServerError(
      url,
      response.status,
      await response.text(),
      durationInMs
    );
  } else {
    // what about the 404?
    throw new TripAdvisorHttpError(
      url,
      response.status,
      await response.text(),
      durationInMs
    );
  }
}

export async function searchTripAdvisorLocationIdNearbyWithRetry(
  name: string,
  latitude: number,
  longitude: number,
  radiusInMeters: number,
  language: string = "en",
  configuration: TripAdvisorConfiguration = DEFAULT_TRIPADVISOR_CONFIGURATION,
  signal?: AbortSignal | undefined
): Promise<TripAdvisorLocation | undefined> {
  return await tripAdvisorCircuitBreaker().execute(async ({ signal: combinedSignal }) => {
    if (combinedSignal?.aborted) {
      throw combinedSignal.reason;
    }
    return await searchTripAdvisorLocationIdNearby(name, latitude, longitude, radiusInMeters, language, configuration, combinedSignal);
  }, signal);
}

async function searchTripAdvisorLocationIdNearby(
  name: string,
  latitude: number,
  longitude: number,
  radiusInMeters: number,
  language: string = "en",
  configuration: TripAdvisorConfiguration = DEFAULT_TRIPADVISOR_CONFIGURATION,
  signal?: AbortSignal | undefined
): Promise<TripAdvisorLocation | undefined> {
  const locationsNearby = await findTripAdvisorLocationsNearby(latitude, longitude, radiusInMeters, language, configuration, signal);
  const bestLocation = findBestTripAdvisorMatch(name, locationsNearby, configuration.similarity);
  return bestLocation ? findTripAdvisorLocationById(bestLocation.locationId, language, configuration, signal) : undefined;
}

async function findTripAdvisorLocationsNearby(
  latitude: number,
  longitude: number,
  radiusInMeters: number,
  language: string = "en",
  configuration: TripAdvisorConfiguration = DEFAULT_TRIPADVISOR_CONFIGURATION,
  signal?: AbortSignal | undefined
): Promise<TripAdvisorLocationNearby[]> {
  console.info(`[TripAdvisor] Finding the location nearby '${latitude},${longitude}' within ${radiusInMeters}m'...`);
  const url = buildUrlToFindLocationNearby(latitude, longitude, radiusInMeters, language, configuration);
  const authenticatedUrl = addAuthenticationOn(url, configuration);
  const start = Date.now();

  const response = await fetch(authenticatedUrl, {
    method: "get",
    signal: signal
  });

  const durationInMs = Date.now() - start;
  if (response.ok) {
    console.info(`[TripAdvisor] Finding the location nearby '${latitude},${longitude}' within ${radiusInMeters}m': done in ${durationInMs} ms.`);
    const body = (await response.json()) as any;
    if (body) {
      return parseLocationsNearby(body);
    } else {
      throw new TripAdvisorEmptyResponseError(
        url,
        response.status,
        await response.text(),
        durationInMs
      );
    }
  } else if (response.status >= 500) {
    throw new TripAdvisorServerError(
      url,
      response.status,
      await response.text(),
      durationInMs
    );
  } else {
    throw new TripAdvisorHttpError(
      url,
      response.status,
      await response.text(),
      durationInMs
    );
  }
}

function buildUrlToFindLocationById(
  locationId: string,
  language: string,
  configuration: TripAdvisorConfiguration
): string {
  const params = new URLSearchParams({
    language: language
  });
  return `${configuration.instanceUrl}/location/${locationId}/details?${params.toString()}`;
}

function buildUrlToFindLocationNearby(
  latitude: number,
  longitude: number,
  radiusInMeters: number,
  language: string,
  configuration: TripAdvisorConfiguration
): string {
  const params = new URLSearchParams({
    language: language,
    latLong: `${latitude},${longitude}`,
    category: "restaurants",
    radius: radiusInMeters.toString(),
    radiusUnit: "m"
  });
  return `${configuration.instanceUrl}/location/nearby_search?${params.toString()}`;
}

function addAuthenticationOn(url: string, configuration: TripAdvisorConfiguration): string {
  return `${url}&key=${configuration.apiKey}`;
}

function parseLocationDetails(
  body: any,
): TripAdvisorLocation | undefined {
  if (!body || typeof body !== 'object') {
    return undefined;
  } else {
    const hours = parseHours(body.hours);
    return {
      id: typeof body.location_id === "string" ? parseInt(body.location_id) : body.location_id,
      name: body.name,
      description: body.description || undefined,
      latitude: typeof body.latitude === "string" ? parseFloat(body.latitude) : body.latitude || undefined,
      longitude: typeof body.longitude === "string" ? parseFloat(body.longitude) : body.longitude || undefined,
      address: parseAddress(body.address_obj),
      timezone: body.timezone,
      tripAdvisorUrl: body.web_url,
      website: body.website || undefined,
      phone: body.phone || undefined,
      rankingData: parseRankingData(body.ranking_data),
      rating: typeof body.rating === "string" ? parseFloat(body.rating) : body.rating || undefined,
      numberOfReviews: parseInt(body.num_reviews || "0", 10),
      numberOfReviewsPerRating: body.review_rating_count
        ? Object.entries(body.review_rating_count).reduce((perRating, [rating, numberOfReviews]) => {
          perRating[parseInt(rating)] = parseInt(numberOfReviews as string, 10);
          return perRating;
        }, {} as { [rating: number]: number })
        : {},
      photoCount: typeof body.rating === "string" ? parseInt(body.photo_count) : 0,
      priceLevel: body.price_level || undefined,
      cuisine: parseLocalizedNames(body.cuisine),
      category: parseLocalizedName(body.category),
      subcategories: parseLocalizedNames(body.subcategory),
      hours: hours,
      openingHours: convertTripAdvisorHoursToOpeningHours(hours),
      features: body.features || [],
      tripTypes: parseTripTypes(body.trip_types),
      imageUrl: undefined, // TODO
      awards: parseAwards(body.awards)
    };
  }
}

function parseLocationNearby(body: any): TripAdvisorLocationNearby | undefined {
  if (body) {
    return {
      locationId: body.location_id,
      name: body.name,
      distanceInMeters: parseDistanceInMeters(body.distance),
      bearing: body.bearing,
      address: parseAddress(body.address_obj)
    };
  } else {
    return undefined;
  }
}

function parseLocationsNearby(body: any,): TripAdvisorLocationNearby[] {
  if (!Array.isArray(body)) {
    console.warn("parseLocationsNearby: Received non-array body", body);
    return [];
  } else {
    return body.map(parseLocationNearby).filter(Boolean).map(location => location!);
  }
}

function parseAddress(body: any): AddressInfo | undefined {
  if (body) {
    const street1 = body?.street1 || undefined;
    const street2 = body?.street2 || undefined;
    const city = body?.city || undefined;
    const state = body?.state || undefined;
    const country = body?.country || undefined;
    const postalcode = body?.postalcode || undefined;
    const addressString = body?.address_string || undefined;
    if (street1 && street2 && city && state && country && postalcode && addressString) {
      return {
        street1: street1,
        street2: street2,
        city: city,
        state: state,
        country: country,
        postalcode: postalcode,
        addressString: addressString
      };
    } else {
      return undefined;
    }
  } else {
    return undefined;
  }
}

function parseRankingData(body: any | undefined): RankingData | undefined {
  if (body) {
    return {
      geoLocationId: body.geo_location_id,
      rankingString: body.ranking_string,
      geoLocationName: body.geo_location_name,
      rankingOutOf: parseInt(body.ranking_out_of || "0", 10),
      ranking: parseInt(body.ranking || "0", 10),
    };
  } else {
    return undefined;
  }
}

function parseLocalizedNames(body: any): LocalizedName[] {
  if (body && Array.isArray(body)) {
    return body.map(parseLocalizedName).filter(Boolean).map(name => name!);
  } else {
    return [];
  }
}

function parseLocalizedName(body: any): LocalizedName | undefined {
  if (body) {
    return {
      name: body.name,
      localizedName: body.localized_name
    };
  } else {
    return undefined;
  }
}

function parseTripTypes(body: any): TripType[] {
  if (Array.isArray(body)) {
    return body.map(parseTripType).filter(Boolean).map(trip => trip!);
  } else {
    return [];
  }
}

function parseTripType(body: any): TripType | undefined {
  if (body) {
    return {
      name: body.name,
      localizedName: body.localized_name,
      value: typeof body.value === "string" ? parseInt(body.value) : body.value || undefined
    };
  } else {
    return undefined;
  }
}

function parseHours(body: any): LocationHours | undefined {
  if (body && Array.isArray(body.periods)) {
    const periods: OperatingPeriod[] = body.periods.map((item: any) => {
      if (!item.open) {
        return undefined;
      } else {
        const period: OperatingPeriod = {
          open: {
            day: typeof item.open.day === "number" ? item.open.day : parseInt(item.open.day || "-1", 10),
            time: item.open.time || "0000"
          }
        };

        if (item.close) {
          period.close = {
            day: typeof item.close.day === "number" ? item.close.day : parseInt(item.close.day || "-1", 10),
            time: item.close.time || "0000"
          };
        }

        return period;
      }
    }).filter(Boolean).map((period: OperatingPeriod) => period!);

    return {
      periods: periods,
      weekdayText: Array.isArray(body.weekday_text) ? body.weekday_text : []
    };
  } else {
    return undefined;
  }
}

function parseAwards(body: any): Award[] {
  if (body && Array.isArray(body)) {
    return body.map(parseAward).filter(Boolean).map(award => award!);
  } else {
    return [];
  }
}

function parseAward(body: any): Award | undefined {
  if (body) {
    return {
      type: body.award_type,
      year: typeof body.year === "string" ? parseInt(body.year) : body.year,
      categories: body.categories,
      displayName: body.display_name
    };
  } else {
    return undefined;
  }
}
function parseDistanceInMeters(distance: any): number {
  const distanceInMiles = typeof distance === "string" ? parseFloat(distance) : distance;
  return distanceInMiles / 16 * 10;
}

