import type { ActionFunctionArgs } from "react-router";

import { searchLocations } from "@features/address.server";
import { validateCSRF } from "@features/session.server";

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
        return await searchLocations(query, context.config.nominatim, context.config.nominatim, request.signal);
      } else {
        throw new Error("AppContext is not initialized.");
      }
    } catch (error) {
      console.error("Address lookup failed:", error);
      return {
        locations: [],
        note: undefined,
        error: "Unable to fetch addresses at this time. Please try again."
      };
    }
  }
}
