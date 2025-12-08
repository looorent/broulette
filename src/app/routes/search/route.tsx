import { redirect, useNavigate, useSubmit } from "react-router";
import { delay } from "~/functions/delay";
import { createEmptySelection, Selection } from "~/types/selection";
import type { Route } from "../search/+types/route";
import { useEffect } from "react";
import { Search } from "~/types/search";

export const handle = {
  supportsLoader: true
};

function findSearch(searchId: string): Search | null {
  return new Search(searchId);
}

// TODO load the search and the latest selection
function findLatestSelection(searchId: string): Selection | null {
  return null;
  // return createEmptySelection(searchId);
}

export async function loader({ params }: Route.LoaderArgs) {
  await delay(4000);
  const search = findSearch(params.searchId);
  const latestSelection = findLatestSelection(params.searchId);
  return {
    search: search ? {
      id: search.id,
      url: search.toUrl()
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
        action: `/searches/${loaderData.search!.id}/selections`,
        replace: true
      });
    }
  }, [loaderData.latestSelection?.id]);
  return null;
}
