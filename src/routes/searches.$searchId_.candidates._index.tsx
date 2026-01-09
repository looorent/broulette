import { href, redirect } from "react-router";

import { ErrorUnknown } from "@components/error/error-unknown";
import { searchCandidate } from "@features/search-engine.server";
import { validateCSRF } from "@features/session.server";
import { getLocale } from "@features/utils/locale.server";

import type { Route } from "./+types/searches.$searchId_.candidates._index";

export async function action({
  request,
  params,
  context
}: Route.ActionArgs) {
  const formData = await request.formData();
  await validateCSRF(formData, request.headers, context.sessionStorage);

  if (context.config) {
    const data = parseAndValidate(formData, params, await getLocale(request));
    const candidate = await searchCandidate(
      data.searchId,
      data.locale,
      context.repositories.search,
      context.repositories.candidate,
      context.repositories.restaurant,
      context.repositories.matching,
      context.config.search,
      context.config.overpass,
      context.config.google,
      context.config.tripAdvisor,
      request.signal
    );

    return redirect(href("/searches/:searchId/candidates/:candidateId", {
      searchId: candidate.searchId,
      candidateId: candidate.id
    }));
  } else {
    throw new Error("AppContext is not initialized.");
  }
}

export async function loader({ params }: Route.LoaderArgs) {
  return redirect(href("/searches/:searchId/candidates/:candidateId", {
    searchId: params.searchId,
    candidateId: "latest"
  }));
}

export function ErrorBoundary({
  error,
}: Route.ErrorBoundaryProps) {
  console.error("[POST candidate] Unexpected error", error);
  return (
    <ErrorUnknown />
  );
}

function parseAndValidate(
  _formData: FormData,
  params: { searchId: string | undefined; },
  locale: string
): {
  searchId: string;
  locale: string;
} {
  if (!params.searchId) {
    throw new Response("No search id", { status: 400 });
  } else {
    return {
      searchId: params.searchId,
      locale: locale
    };
  }
}
