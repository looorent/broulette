import { createCircuitBreaker } from "../circuit_breaker/circuit_breaker";
import { TripAdvisorEmptyResponseError, TripAdvisorExceedsNumberOfCallsError, TripAdvisorHttpError, TripAdvisorLocationNotFoundError, TripAdvisorServerError } from "./error";
import { TripAdvisorLocation, TripAdvisorLocationSearchResult } from "./types";

const CATEGORY = "restaurants";
const FOLLOW_REDIRECT = "follow";
const HEADERS = new Headers({
    "Accept": "application/json"
});
const DEFAULT_CURRENCY = "EUR";
const DEFAULT_LANGUAGE = "en";
const METERS = "m";
const LOCATION_URL = "https://api.content.tripadvisor.com/api/v1/location";

function buildQueryParameters(parameters: {[argumentName: string]: string}): string {
    return Object.entries(parameters)
                 .filter(([, value]) => value?.length > 0)
                 .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
                 .join("&");
}

export class TripAdvisorRestaurantRepository {
    private numberOfCalls: number = 0;
    constructor(
        private readonly apiKey: string,
        private readonly maximumNumberOfCalls: number // to avoid a big invoice
    ) {}
    
    // TODO this operation is free
    async findLocationsNearby(searchQuery: string, latitude: number, longitude: number, radiusInMeters: number, address: string | undefined, language: string | undefined): Promise<TripAdvisorLocationSearchResult[]> {
        return await createCircuitBreaker(() => findLocationsNearbyWithoutRetry(this.numberOfCalls++, this.maximumNumberOfCalls, this.apiKey, searchQuery, latitude, longitude, radiusInMeters, address, language));
    }

    // TODO this operation is NOT free (maybe add a different limit for the free and costy calls?)
    async findLocationDetails(locationId: number, language: string | undefined, currency: string | undefined): Promise<TripAdvisorLocation | undefined> {
        return await createCircuitBreaker(() => findLocationDetailsWithoutRetry(this.numberOfCalls++, this.maximumNumberOfCalls, this.apiKey, locationId, language, currency));
    }
}

async function findLocationsNearbyWithoutRetry(numberOfCalls: number, maximumNumberOfCalls: number, apiKey: string, searchQuery: string, latitude: number, longitude: number, radiusInMeters: number, address: string | undefined, language: string | undefined): Promise<TripAdvisorLocationSearchResult[]> {
    if (numberOfCalls > maximumNumberOfCalls) {
        throw new TripAdvisorExceedsNumberOfCallsError(maximumNumberOfCalls, numberOfCalls);
    } else {
        const query = buildQueryParameters({
            language: language?.trim() || DEFAULT_LANGUAGE,
            searchQuery: searchQuery?.trim(),
            address: address?.trim() || "",
            latLong: `${latitude},${longitude}`,
            radius: String(radiusInMeters || 0),
            radiusUnit: METERS,
            category: CATEGORY
        });
        console.info(`[TripAdvisor] Search closest locations nearby this query '${query}'...`);

        const start = Date.now();
        const response = await fetch(`${LOCATION_URL}/search?key=${encodeURIComponent(apiKey)}&${query}`, {
            method: "GET",
            headers: HEADERS,
            redirect: FOLLOW_REDIRECT
        });
        const durationInMs = Date.now() - start;

        if (response.ok) {
            console.info(`[TripAdvisor] Search closest locations nearby this query '${query}': done in ${durationInMs} ms.`);
            const body = await response.json() as any;
            if (body) {
                return body?.data?.map(parseTripAdvisorLocationSearchResult).filter(Boolean);
            } else {
                throw new TripAdvisorEmptyResponseError(query, response.status, await response.text(), durationInMs);
            }
        } else if (response.status >= 500) {
            throw new TripAdvisorServerError(query, response.status, await response.text(), durationInMs);
        } else {
            throw new TripAdvisorHttpError(query, response.status, await response.text(), durationInMs);
        }
    }
}

async function findLocationDetailsWithoutRetry(numberOfCalls: number, maximumNumberOfCalls: number, apiKey: string, locationId: number, language: string | undefined, currency: string | undefined): Promise<TripAdvisorLocation | undefined> {
    if (numberOfCalls > maximumNumberOfCalls) {
        throw new TripAdvisorExceedsNumberOfCallsError(maximumNumberOfCalls, numberOfCalls);
    } else {
            const query = buildQueryParameters({
            language: language?.trim() || DEFAULT_LANGUAGE,
            currency: currency?.toUpperCase() || DEFAULT_CURRENCY
        });
        console.info(`[TripAdvisor] Search specific location by id '${locationId}'...`);

        const start = Date.now();
        const response = await fetch(`${LOCATION_URL}/search?key=${encodeURIComponent(apiKey)}&${query}`, {
            method: "GET",
            headers: HEADERS,
            redirect: FOLLOW_REDIRECT
        });
        const durationInMs = Date.now() - start;

        if (response.ok) {
            console.info(`[TripAdvisor] Search specific location by id '${locationId}': done in ${durationInMs} ms.`);
            const body = await response.json() as any;
            if (body) {
                return parseTripAdvisorLocation(body);
            } else {
                throw new TripAdvisorEmptyResponseError(query, response.status, await response.text(), durationInMs);
            }
        } else if (response.status === 404) {
            throw new TripAdvisorLocationNotFoundError(locationId, query, response.status, await response.text(), durationInMs);
        } else if (response.status >= 500) {
            throw new TripAdvisorServerError(query, response.status, await response.text(), durationInMs);
        } else {
            throw new TripAdvisorHttpError(query, response.status, await response.text(), durationInMs);
        }
    }
}

function parseTripAdvisorLocationSearchResult(json: any): TripAdvisorLocationSearchResult | undefined {
    if (json) {
        return new TripAdvisorLocationSearchResult(
            parseInt(json.location_id),
            json.name,
            parseFloat(json.distance),
            json.bearing,
            json.address_obj
        );
    } else {
        return undefined;
    }
}

// TODO Lorent improve
function parseTripAdvisorLocation(json: any): TripAdvisorLocation | undefined {
    if (json) {
        return new TripAdvisorLocation(
            json.location_id ?? "",
            json.name ?? "",
            json.web_url ?? "",
            {
                street1: json.address_obj?.street1 ?? "",
                city: json.address_obj?.city ?? "",
                state: json.address_obj?.state ?? "",
                country: json.address_obj?.country ?? "",
                postalcode: json.address_obj?.postalcode ?? "",
                addressString: json.address_obj?.address_string ?? "",
            },
            json.ancestors?.map((a: any) => ({
                level: a.level ?? "",
                name: a.name ?? "",
                locationId: a.location_id ?? "",
            })) ?? [],
            parseFloat(json.latitude) || 0,
            parseFloat(json.longitude) || 0,
            json.timezone ?? "",
            json.email ?? "",
            json.phone ?? "",
            json.website ?? "",
            json.write_review ?? "",
            {
                geoLocationId: json.ranking_data?.geo_location_id ?? "",
                rankingString: json.ranking_data?.ranking_string ?? "",
                geoLocationName: json.ranking_data?.geo_location_name ?? "",
                rankingOutOf: parseInt(json.ranking_data?.ranking_out_of) || 0,
                ranking: parseInt(json.ranking_data?.ranking) || 0,
            },
            parseFloat(json.rating) || 0,
            json.rating_image_url ?? "",
            parseInt(json.num_reviews) || 0,
            Object.fromEntries(
                Object.entries(json.review_rating_count ?? {}).map(([k, v]) => [k, parseInt(v as string) || 0])
            ),
            Object.values(json.subratings ?? {}).map((s: any) => ({
                name: s.name ?? "",
                localizedName: s.localized_name ?? "",
                ratingImageUrl: s.rating_image_url ?? "",
                value: parseFloat(s.value) || 0,
            })),
            parseInt(json.photo_count) || 0,
            json.see_all_photos ?? "",
            json.price_level ?? "",
            {
                periods: json.hours?.periods ?? [],
                weekdayText: json.hours?.weekday_text ?? [],
            },
            json.features ?? [],
            json.cuisine?.map((c: any) => ({
                name: c.name ?? "",
                localizedName: c.localized_name ?? "",
            })) ?? [],
            {
                name: json.category?.name ?? "",
                localizedName: json.category?.localized_name ?? "",
            },
            json.subcategory?.map((s: any) => ({
                name: s.name ?? "",
                localizedName: s.localized_name ?? "",
            })) ?? [],
            json.trip_types?.map((t: any) => ({
                name: t.name ?? "",
                localizedName: t.localized_name ?? "",
                value: parseInt(t.value) || 0,
            })) ?? [],
            json.awards ?? []
        );
    } else {
        return undefined;
    }
}