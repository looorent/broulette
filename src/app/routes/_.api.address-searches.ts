import type { ActionFunctionArgs } from "react-router";

import { searchLocations } from "@features/address.server";
import { validateCSRF } from "@features/session.server";

// TODO this returns too many duplicates (ex: Namur)
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    throw new Response("Method Not Allowed", { status: 405 });
  }

  const formData = await request.formData();
  const query = formData.get("query");
  await validateCSRF(formData, request.headers);

  if (!query || typeof query !== "string" || query.length < 2) {
    return {
      locations: [],
      note: undefined
    };
  } else {
    try {
      return await searchLocations(query, request.signal);
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
