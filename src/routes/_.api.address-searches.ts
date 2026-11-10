import type { ActionFunctionArgs } from "react-router";

import { searchLocations } from "@features/address.server";
import type { Coordinates } from "@features/coordinate";
import { checkRateLimit } from "@features/rate-limit.server";
import { validateCSRF } from "@features/session.server";
import { logger } from "@features/utils/logger";
import { getClientIp } from "@features/utils/request";

import { requestContext } from "../request-context.server";

export async function action({ request, context }: ActionFunctionArgs) {
  const app = context.get(requestContext);
  if (request.method !== "POST") {
    throw new Response("Method Not Allowed", { status: 405 });
  }

  const formData = await request.formData();
  const query = formData.get("query");
  await validateCSRF(formData, request.headers, app.sessionStorage);

  if (!app.config) {
    logger.error("Address lookup failed: AppContext is not initialized.");
    return {
      locations: [],
      note: undefined,
      error: "Unable to fetch addresses at this time. Please try again."
    };
  }

  const ip = getClientIp(request.headers);

  const rateLimit = await checkRateLimit(
    app.cloudflare.env.KV,
    `ratelimit:address-search:${ip}`,
    app.config.addressSearchRateLimit
  );

  if (!rateLimit.allowed) {
    return {
      locations: [],
      error: "Too many requests. Please wait a moment.",
      note: undefined
    };
  } else if (!query || typeof query !== "string" || query.length < 2) {
    return {
      locations: [],
      note: undefined
    };
  } else {
    try {
      const locationBias = parseLocationBias(formData);
      return await searchLocations(
        query,
        app.config.nominatim,
        app.config.photon,
        locationBias,
        request.signal,
        {
          keyStore: app.cloudflare.env.KV,
          ttlSeconds: app.config.addressSearchCache.ttlSeconds
        }
      );
    } catch (error) {
      logger.error("Address lookup failed:", error);
      return {
        locations: [],
        note: undefined,
        error: "Unable to fetch addresses at this time. Please try again."
      };
    }
  }
}

function parseLocationBias(formData: FormData): Coordinates | undefined {
  const providedLatitude = formData.get("latitudeBias");
  const providedLongitude = formData.get("longitudeBias");
  if (providedLatitude && providedLongitude && typeof providedLatitude === "string" && typeof providedLongitude === "string") {
    const latitude = parseFloat(providedLatitude);
    const longitude = parseFloat(providedLongitude);
    if (!isNaN(latitude) && !isNaN(longitude)) {
      return {
        latitude: latitude,
        longitude: longitude
      }
    }
  }
}
