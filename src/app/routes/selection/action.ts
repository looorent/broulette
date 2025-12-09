import { redirect } from "react-router";
import { delay } from "~/functions/delay";
import { createEmptySearch } from "~/types/search";
import { createDefaultSelection } from "~/types/selection";
import type { Route } from "../../+types/root";

// TODO start a new search in the session
export async function action({
  request,
}: Route.ActionArgs) {
  let formData = await request.formData();
  let title = formData.get("title");
  await delay(5000);
  const search = createEmptySearch();
  const selection = createDefaultSelection(search.id);
  return redirect(selection.toUrl());
}
