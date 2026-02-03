import type { ActionFunctionArgs } from "react-router";

import { searchLocations } from "@features/address.server";
import type { Coordinates } from "@features/coordinate";
import { validateCSRF } from "@features/session.server";
import { logger } from "@features/utils/logger";

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    throw new Response("Method Not Allowed", { status: 405 });
  }

  const formData = await request.formData();
  const query = formData.get("query");
  await validateCSRF(formData, request.headers, context.sessionStorage);

  if (!query || typeof query !== "string" || query.length < 2) {
    return {
      locations: [],
      note: undefined
    };
  } else {
    try {
      if (context.config) {
        const locationBias = parseLocationBias(formData);
        return await searchLocations(query, context.config.nominatim, context.config.photon, locationBias, request.signal);
      } else {
        throw new Error("AppContext is not initialized.");
      }
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
