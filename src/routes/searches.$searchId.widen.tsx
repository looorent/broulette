import { href, redirect } from "react-router";

import { validateCSRF } from "@features/session.server";
import { logger } from "@features/utils/logger";

import type { Route } from "./+types/searches.$searchId.widen";

export async function loader() {
  return redirect(href("/"));
}

export async function action({ params, request, context }: Route.ActionArgs) {
  if (request.method !== "POST") {
    throw new Response("Method Not Allowed", { status: 405 });
  }

  const formData = await request.formData();
  await validateCSRF(formData, request.headers, context.sessionStorage);

  const { searchId } = params;
  const originalSearch = await context.repositories.search.findByIdWithCandidateContext(searchId);

  if (!originalSearch) {
    logger.error("[POST /searches/%s/widen] Search not found", searchId);
    return redirect(href("/"));
  }

  if (originalSearch.distanceRange !== "Close") {
    logger.log("[POST /searches/%s/widen] Search is not Close range, skipping widen", searchId);
    return redirect(href("/"));
  }

  logger.log("[POST /searches/%s/widen] Widening search to MidRange", searchId);

  const widenedSearch = await context.repositories.search.create(
    originalSearch.latitude,
    originalSearch.longitude,
    originalSearch.serviceDate,
    originalSearch.serviceTimeslot,
    "MidRange",
    originalSearch.avoidFastFood,
    originalSearch.avoidTakeaway,
    originalSearch.minimumRating
  );

  return redirect(href("/searches/:searchId", { searchId: widenedSearch.id }));
}
