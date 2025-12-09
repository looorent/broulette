import { useEffect } from "react";
import { useNavigate, useSubmit } from "react-router";
import prisma from "~/functions/db/prisma.server";
import type { Route } from "../search/+types/page";

async function findSearchWithLatestCandidate(searchId: string) {
  return await prisma.search.findUnique({
    where: {
      id: searchId
    },
    include: {
      candidates: {
        orderBy: {
          order: "desc" as const,
        },
        where: {
          status: CandidateStatus.Returned
        },
        take: 1
      }
    }
  });
}

export async function loader({ params }: Route.LoaderArgs) {
  const search = await findSearchWithLatestCandidate(params.searchId);
  const latestCandidate = search?.candidates?.[0];
  console.log("search", search);
  console.log("latestCandidate", latestCandidate);
  return {
    search: search ? {
      id: search.id,
      url: search.toUrl(),
      newCandidateUrl: search.toNewCandidateUrl()
    } : null,
    latestCandidate: latestCandidate ? {
      id: latestCandidate.id,
      url: latestCandidate.toUrl()
    } : null
  };
}

export default function SearchPage({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const submit = useSubmit();

  useEffect(() => {
    if (loaderData.latestCandidate) {
      navigate(loaderData.latestCandidate.url, { replace: true });
    } else if (loaderData.search) {
      submit({
        searchId: loaderData.search.id
      }, {
        method: "POST",
        action: loaderData.search.newCandidateUrl,
        replace: true,
        viewTransition: true
      });
    }
  }, [loaderData.latestCandidate?.id]);

  return null;
}
