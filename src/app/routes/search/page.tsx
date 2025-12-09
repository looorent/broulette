import { useEffect } from "react";
import { useNavigate, useSubmit } from "react-router";
import prisma from "~/lib/prisma";
import { Selection } from "~/types/selection";
import type { Route } from "../search/+types/page";

async function findSearch(searchId: string) {
  return await prisma.search.findUnique({
    where: {
      id: searchId
    }
  });
}

// TODO load the search and the latest selection
function findLatestSelection(searchId: string): Selection | null {
  return null;
}

export async function loader({ params }: Route.LoaderArgs) {
  const search = await findSearch(params.searchId);
  const latestSelection = findLatestSelection(params.searchId);
  return {
    search: search ? {
      id: search.id,
      url: search.toUrl(),
      newSelectionUrl: search.toNewSelectionUrl()
    } : null,
    latestSelection: latestSelection ? {
      id: latestSelection.id,
      url: latestSelection.toUrl()
    } : null
  };
}

export default function SearchPage({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const submit = useSubmit();

  useEffect(() => {
    if (loaderData.latestSelection) {
      navigate(loaderData.latestSelection.url, { replace: true });
    } else if (loaderData.search) {
      submit({
        searchId: loaderData.search.id
      }, {
        method: "POST",
        action: loaderData.search.newSelectionUrl,
        replace: true,
        viewTransition: true
      });
    }
  }, [loaderData.latestSelection?.id]);

  return null;
}
