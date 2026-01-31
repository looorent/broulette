import { useEffect } from "react";
import { href, redirect, useRouteLoaderData } from "react-router";

import { ErrorUnknown } from "@components/error/error-unknown";
import { useSearchLoader } from "@components/search-loader";
import { useSearchStream } from "@features/search";
import { getLocale } from "@features/utils/locale.server";
import { logger } from "@features/utils/logger";
import { findSearchViewModel } from "@features/view.server";
import type { loader as rootLoader } from "src/root";

import type { Route } from "./+types/searches.$searchId";

export async function loader({ params, request, context }: Route.LoaderArgs) {
  const view = await findSearchViewModel(params.searchId, await getLocale(request), context.repositories.search);
  if (view) {
    if (view.redirectRequired) {
      return redirect(href("/searches/:searchId/candidates/:candidateId", { searchId: view.searchId, candidateId: view.latestCandidateId }));
    } else {
      return {
        view: view,
        newCandidateUrl: href("/searches/:searchId/candidates", { searchId: view.id })
      };
    }
  } else {
    logger.error("[GET search] No candidate found for searchId='%s'", params.searchId);
    return redirect(href("/"));
  }
}

export default function SearchPage({ loaderData }: Route.ComponentProps) {
  const { setLoaderStreaming } = useSearchLoader();
  const { streamSearch } = useSearchStream();
  const session = useRouteLoaderData<typeof rootLoader>("root");
  const { view, newCandidateUrl } = loaderData;

  useEffect(() => {
    const abortController = new AbortController();

    const timeoutId = setTimeout(() => {
      setLoaderStreaming(false);
      streamSearch(newCandidateUrl, session?.csrfToken ?? "", abortController.signal);
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [newCandidateUrl, session?.csrfToken, setLoaderStreaming, streamSearch]);

  return (
    <title>{`BiteRoulette - ${view.label} - Searching...`}</title>
  );
}

export function ErrorBoundary({
  error,
}: Route.ErrorBoundaryProps) {
  logger.error("[POST search] Unexpected error", error);
  return (
    <ErrorUnknown />
  );
}
