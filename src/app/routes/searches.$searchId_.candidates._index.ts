import { SEARCH_ENGINE_CONFIGURATION } from "@config/server";
import { searchCandidate } from "@features/search-engine.server";
import { validateCSRF } from "@features/session.server";
import { href, redirect } from "react-router";
import type { Route } from "./+types/searches.$searchId_.candidates._index";

export async function action({
  request,
  params
}: Route.ActionArgs) {
  const formData = await request.formData();
  await validateCSRF(formData, request.headers);
  if (params.searchId) {
    const candidate = await searchCandidate(params.searchId, SEARCH_ENGINE_CONFIGURATION, request.signal);
    if (candidate) {
      return redirect(href("/searches/:searchId/candidates/:candidateId", { searchId: candidate.searchId, candidateId: candidate.id }));
    } else {
      // TODO manage error (for example, if there is NO candidate, display something)
      return redirect(href("/")); // we should display a message
    }
  } else {
    // TODO manage error
  }
}

export async function loader({ params }: Route.LoaderArgs) {
  return redirect(href("/searches/:searchId/candidates/:candidateId", { searchId: params.searchId, candidateId: "latest" }));
}
