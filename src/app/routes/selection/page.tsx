import { redirect } from "react-router";
import { delay } from "~/functions/delay";
import { Search } from "~/types/search";
import { createEmptySelection } from "~/types/selection";
import type { Route } from "../selection/+types/page";

export async function loader({ params }: Route.LoaderArgs) {
  const search = new Search(params.searchId);
  const selection = createEmptySelection(search.id);
  if ("latest" === params.searchId.toLowerCase()) {
    throw redirect(selection.toUrl());
  } else {
    await delay(5000);
    return {
      selection: selection
    };
  }
}

// TODO
export default function SelectionPage({ loaderData }: Route.ComponentProps) {
  let { selection } = loaderData;
  return (
    <div>
      {selection.id}
    </div>
  );
}
