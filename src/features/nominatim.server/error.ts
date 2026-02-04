import { ApiHttpError, ApiServerError, createResponseErrorParser } from "@features/circuit-breaker.server";

export type NominatimError = ApiServerError | ApiHttpError;
export const parseNominatimError = createResponseErrorParser("Nominatim");
