import { href, redirect } from "react-router";

import { ErrorUnknown } from "@components/error/error-unknown";
import { SEARCH_ENGINE_CONFIGURATION } from "@config/server";
import { searchCandidate } from "@features/search-engine.server";
import { validateCSRF } from "@features/session.server";

import type { Route } from "./+types/searches.$searchId_.candidates._index";


const locale = "en-US"; // TODO manage locale

export async function action({
  request,
  params
}: Route.ActionArgs) {
  const formData = await request.formData();
  // TODO add validation
  await validateCSRF(formData, request.headers);
  if (params.searchId) {
    const candidate = await searchCandidate(params.searchId, locale, SEARCH_ENGINE_CONFIGURATION, request.signal);
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

export function ErrorBoundary() {
  return (
    <ErrorUnknown />
  );
}

