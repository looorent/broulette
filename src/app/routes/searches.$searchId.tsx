import prisma from "@features/db.server/prisma";
import { useEffect, useRef } from "react";
import { href, redirect, useSubmit } from "react-router";
import type { Route } from "./+types/searches.$searchId";

export async function loader({ params }: Route.LoaderArgs) {
  if (params.searchId) {
    const search = await prisma.search.findWithLatestCandidate(params.searchId);
    if (search) {
      const latestCandidate = search.candidates?.[0];
      if (latestCandidate) {
        return redirect(href("/searches/:searchId/candidates/:candidateId", { searchId: search.id, candidateId: latestCandidate.id }))
      } else {
        return {
          search: search,
          newCandidateUrl: href("/searches/:searchId/candidates", { searchId: search.id })
        };
      }
    } else {
      // TODO manage if search is null (error handling)
      return redirect(href("/"));
    }
  } else {
    return redirect(href("/"));
  }
}

export default function SearchPage({ loaderData }: Route.ComponentProps) {
  const submit = useSubmit();
  const initialized = useRef(false);

  const { search, newCandidateUrl } = loaderData;
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      submit({
        searchId: search.id
      }, {
        method: "POST",
        action: newCandidateUrl,
        replace: true,
        viewTransition: true
      });
    }
  }, [search.id, submit]);

  return null;
}
