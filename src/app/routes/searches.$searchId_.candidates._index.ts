import { DEFAULT_SEARCH_ENGINE_CONFIGURATION } from "@config";
import { searchCandidate } from "@features/search-engine.server";
import { href, redirect } from "react-router";
import type { Route } from "./+types/searches.$searchId_.candidates._index";

export async function action({
  request,
}: Route.ActionArgs) {
  const formData = await request.formData();
  const searchId = formData.get("searchId")?.toString();
  if (searchId) {
    const candidate = await searchCandidate(searchId, DEFAULT_SEARCH_ENGINE_CONFIGURATION);
    if (candidate) {
      return redirect(href("/searches/:searchId/candidates/:candidateId", { searchId: candidate.searchId, candidateId: candidate.id }));
    } else {
      // TODO manage error
      return redirect(href("/")); // we should display a message
    }
  } else {
    // TODO manage error
  }
}

export async function loader({ params }: Route.LoaderArgs) {
  return redirect(href("/searches/:searchId/candidates/:candidateId", { searchId: params.searchId, candidateId: "latest" }));
}
