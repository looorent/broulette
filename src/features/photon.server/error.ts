import { ApiHttpError, ApiServerError, createResponseErrorParser } from "@features/circuit-breaker.server";

export type PhotonError = ApiServerError | ApiHttpError;
export const parsePhotonError = createResponseErrorParser("Photon");
