import { CircuitBreakerError } from "../circuit_breaker/error";

export abstract class OsmError extends CircuitBreakerError {
    constructor(message: string, readonly query: string, readonly responseStatusCode: number, readonly responseBody: string, readonly durationInMs: number) {
        super(message);
        this.name = "OsmError";
        this.query = query;
        this.responseStatusCode = responseStatusCode;
        this.responseBody = responseBody;
        this.durationInMs = durationInMs;
    }
}

export class OsmServerError extends OsmError {
    constructor(query: string, responseStatusCode: number, responseBody: string, durationInMs: number) {
        super(`[OSM] Fetching all OSM restaurants: server failed after ${durationInMs} ms with status code ${responseStatusCode}`, query, responseStatusCode, responseBody, durationInMs);
        this.name = "OsmServerError";
    }
    override isRetriable(): boolean {
        return true;
    }
}

export class OsmHttpError extends OsmError {
    constructor(query: string, responseStatusCode: number, responseBody: string, durationInMs: number) {
        super(`[OSM] Fetching all OSM restaurants: http call failed after ${durationInMs} ms with status code ${responseStatusCode}`, query, responseStatusCode, responseBody, durationInMs);
        this.name = "OsmHttpError";
    }
    override isRetriable(): boolean {
        return false;
    }
}

export class OsmEmptyResponseError extends OsmError {
    constructor(query: string, responseStatusCode: number, responseBody: string, durationInMs: number) {
        super(`[OSM] Fetching all OSM restaurants: empty response after ${durationInMs} ms with status code ${responseStatusCode}`, query, responseStatusCode, responseBody, durationInMs);
        this.name = "OsmEmptyResponseError";
    }
    override isRetriable(): boolean {
        return true;
    }
}