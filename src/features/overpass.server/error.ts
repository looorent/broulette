import { ApiHttpError, ApiServerError, createResponseErrorParser } from "@features/circuit-breaker.server";

export type OsmError = ApiServerError | ApiHttpError;
export const OsmServerError = ApiServerError;
export const OsmHttpError = ApiHttpError;
export const parseOsmError = createResponseErrorParser("OSM");
