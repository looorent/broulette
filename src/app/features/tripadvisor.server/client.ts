import { tripAdvisorCircuitBreaker } from "./circuit-breaker";
import { TripAdvisorEmptyResponseError, TripAdvisorHttpError, TripAdvisorServerError } from "./error";
import { DEFAULT_TRIPADVISOR_CONFIGURATION, type TripAdvisorConfiguration, type TripAdvisorLocation, type TripAdvisorLocationNearby } from "./types";

export async function findTripAdvisorLocationByIdWithRetry(
  locationId: string,
  configuration: TripAdvisorConfiguration = DEFAULT_TRIPADVISOR_CONFIGURATION,
  signal?: AbortSignal | undefined
): Promise<TripAdvisorLocation | undefined> {
  return await tripAdvisorCircuitBreaker().execute(async ({ signal: combinedSignal }) => {
    if (combinedSignal?.aborted) {
      throw combinedSignal.reason;
    }
    return await findTripAdvisorLocationById(locationId, configuration, combinedSignal);
  }, signal);
}

async function findTripAdvisorLocationById(
  locationId: string,
  configuration: TripAdvisorConfiguration = DEFAULT_TRIPADVISOR_CONFIGURATION,
  signal?: AbortSignal | undefined
): Promise<TripAdvisorLocation | undefined> {
  console.info(`[TripAdvisor] Finding the location with id='${locationId}'...`);
  const url = buildUrlToFindLocationById(locationId, configuration);
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

export async function searchTripAdvisorLocationsNearbyWithRetry(
  address: string, // TODO useless?
  latitude: number,
  longitude: number,
  radiusInMeters: number,
  configuration: TripAdvisorConfiguration = DEFAULT_TRIPADVISOR_CONFIGURATION,
  signal?: AbortSignal | undefined
): Promise<TripAdvisorLocationNearby[]> {
  return await tripAdvisorCircuitBreaker().execute(async ({ signal: combinedSignal }) => {
    if (combinedSignal?.aborted) {
      throw combinedSignal.reason;
    }
    return await searchTripAdvisorLocationsNearby(address, latitude, longitude, radiusInMeters, configuration, combinedSignal);
  }, signal);
}


async function searchTripAdvisorLocationsNearby(
  address: string, // TODO useless?
  latitude: number,
  longitude: number,
  radiusInMeters: number,
  configuration: TripAdvisorConfiguration = DEFAULT_TRIPADVISOR_CONFIGURATION,
  signal?: AbortSignal | undefined
): Promise<TripAdvisorLocationNearby[]> {
  console.info(`[TripAdvisor] Finding the location nearby '${latitude},${longitude}' within ${radiusInMeters}m'...`);
  const url = buildUrlToFindLocationNearby(address, latitude, longitude, radiusInMeters, configuration);
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


function buildUrlToFindLocationById(locationId: string, configuration: TripAdvisorConfiguration): string {
  const params = new URLSearchParams({
    language: "en", // TODO make this configurable?
  });
  return `${configuration.instanceUrl}/location/${locationId}/details?${params.toString()}`;
}

function buildUrlToFindLocationNearby(
  address: string,
  latitude: number,
  longitude: number,
  radiusInMeters: number,
  configuration: TripAdvisorConfiguration
): string {
  const params = new URLSearchParams({
    address: address,
    language: "en", // TODO make this configurable?
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
  throw new Error("Function not implemented.");
}

function parseLocationsNearby(
  body: any,
): TripAdvisorLocationNearby[] {
  throw new Error("Function not implemented.");
}


