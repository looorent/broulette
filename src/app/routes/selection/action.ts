import { redirect } from "react-router";
import type { Route } from "../../+types/root";
import { delay } from "~/functions/delay";
import { createEmptySearch } from "~/types/search";
import { createEmptySelection } from "~/types/selection";

// TODO start a new search in the session
export async function action({
  request,
}: Route.ActionArgs) {
  let formData = await request.formData();
  let title = formData.get("title");
  await delay(5000);
  const search = createEmptySearch();
  const selection = createEmptySelection(search.id);
  return redirect(selection.toUrl());
}
