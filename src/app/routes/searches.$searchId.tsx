import { useEffect, useRef } from "react";
import { href, redirect, useRouteLoaderData, useSubmit } from "react-router";

import { ErrorUnknown } from "@components/error/error-unknown";
import { getPrisma } from "@features/db.server";
import { getLocale } from "@features/utils/locale.server";
import { findSearchViewModel } from "@features/view.server";
import type { loader as rootLoader } from "app/root";

import type { Route } from "./+types/searches.$searchId";

export async function loader({ params, request, context }: Route.LoaderArgs) {
  const prisma = getPrisma(context.cloudflare.env);
  const view = await findSearchViewModel(params.searchId, await getLocale(request), prisma);
  if (view) {
    if (view.redirectRequired) {
      return redirect(href("/searches/:searchId/candidates/:candidateId", { searchId: view.searchId, candidateId: view.latestCandidateId }))
    } else {
      return {
        view: view,
        newCandidateUrl: href("/searches/:searchId/candidates", { searchId: view.id })
      };
    }
  } else {
    console.error(`No candidate found for searchId='${params.searchId}'`);
    return redirect(href("/"));
  }
}

export default function SearchPage({ loaderData }: Route.ComponentProps) {
  const submit = useSubmit();
  const initialized = useRef(false);
  const session = useRouteLoaderData<typeof rootLoader>("root");

  const { view, newCandidateUrl } = loaderData;
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      submit({
        csrf: session?.csrfToken ?? ""
      }, {
        method: "POST",
        action: newCandidateUrl,
        replace: true,
        viewTransition: true
      });
    }
  }, [view.id, submit, session?.csrfToken, newCandidateUrl]);

  return (
    <title>{`BiteRoulette - ${view.label} - Searching...`}</title>
  );
}

export function ErrorBoundary({
  error,
}: Route.ErrorBoundaryProps) {
  console.error("[POST search] Unexpected error", error);
  return (
    <ErrorUnknown />
  );
}
