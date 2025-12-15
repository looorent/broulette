import prisma from "@features/db.server/prisma";
import { useEffect, useRef } from "react";
import { href, redirect, useNavigate, useSubmit } from "react-router";
import type { Route } from "./+types/searches.$searchId";

export async function loader({ params }: Route.LoaderArgs) {
  if (params.searchId) {
    return {
      search: await prisma.search.findWithLatestCandidate(params.searchId)
    };
  } else {
    return redirect("/");
  }
}

export default function SearchPage({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const submit = useSubmit();
  const done = useRef(false);

  const { search } = loaderData;
  const latestCandidate = search?.candidates?.[0];

  // TODO manage if search is null
  useEffect(() => {
    if (!done.current) {
      done.current = true;

      if (latestCandidate) {
        navigate(href("/searches/:searchId/candidates/:candidateId", { searchId: search.id, candidateId: latestCandidate.id }), { replace: true })
      } else if (loaderData.search) {
        submit({
          searchId: loaderData.search.id
        }, {
          method: "POST",
          action: href("/searches/:searchId/candidates", { searchId: search!.id }),
          replace: true,
          viewTransition: true
        });
      }
    }
  }, [latestCandidate]);

  return null;
}
