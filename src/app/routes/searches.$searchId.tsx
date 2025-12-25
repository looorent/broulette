import { useEffect, useRef } from "react";
import { href, redirect, useRouteLoaderData, useSubmit } from "react-router";

import { findSearchViewModel } from "@features/view.server";
import type { loader as rootLoader } from "app/root";

import type { Route } from "./+types/searches.$searchId";

const locale = "en-US"; // TODO manage locale
export async function loader({ params }: Route.LoaderArgs) {
  const view = await findSearchViewModel(params.searchId, locale);
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
    // TODO manage error
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
