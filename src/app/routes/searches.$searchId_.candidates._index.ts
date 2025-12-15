import { searchCandidate } from "@features/search-engine.server";
import { buildUrlForCandidate } from "@features/search.server";
import { redirect } from "react-router";
import type { Route } from "./+types/searches.$searchId_.candidates._index";
import { DEFAULT_SEARCH_ENGINE_CONFIGURATION } from "@config";

export async function action({
  request,
}: Route.ActionArgs) {
  const formData = await request.formData();
  const searchId = formData.get("searchId")?.toString();
  if (searchId) {
    const candidate = await searchCandidate(searchId, DEFAULT_SEARCH_ENGINE_CONFIGURATION);
    if (candidate) {
      return redirect(buildUrlForCandidate(candidate.searchId, candidate.id));
    } else {
      // TODO manage error
      return redirect("/"); // we should display a message
    }
  } else {
    // TODO manage error
  }
}

export async function loader({ params }: Route.LoaderArgs) {
  return redirect(buildUrlForCandidate(params.searchId, "latest"));
}
