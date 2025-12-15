import prisma from "@features/db.server/prisma";
import { buildUrlForCandidate, buildUrlForNewCandidate } from "@features/search.server";
import { useEffect, useRef } from "react";
import { redirect, useNavigate, useSubmit } from "react-router";
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
        navigate(buildUrlForCandidate(search.id, latestCandidate.id), { replace: true }); // TODO move this to the loader (the url build)
      } else if (loaderData.search) {
        submit({
          searchId: loaderData.search.id
        }, {
          method: "POST",
          action: buildUrlForNewCandidate(search!.id),
          replace: true,
          viewTransition: true
        });
      }
    }
  }, [latestCandidate]);

  return null;
}
