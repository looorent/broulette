import { GEOCODING_CONFIGURATION } from "@config/server";
import { searchLocations } from "@features/address.server";
import type { ActionFunctionArgs } from "react-router";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    throw new Response("Method Not Allowed", { status: 405 });
  }

  const formData = await request.formData();
  const query = formData.get("query");

  if (!query || typeof query !== "string" || query.length < 2) {
    return {
      locations: [],
      note: undefined
    };
  } else {
    try {
      return await searchLocations(query, GEOCODING_CONFIGURATION, request.signal);
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
