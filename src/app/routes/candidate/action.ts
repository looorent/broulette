import { redirect } from "react-router";
import { searchCandidate } from "~/functions/search/engine.server";
import { buildUrlForCandidate } from "~/functions/url";
import type { Route } from "./+types/action";

export async function action({
  request,
}: Route.ActionArgs) {
  const formData = await request.formData();
  const searchId = formData.get("searchId")?.toString();
  if (searchId) {
    const candidate = await searchCandidate(searchId);
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
