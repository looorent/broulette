import { redirect } from "react-router";
import type { Route } from "../../+types/root";
import { delay } from "~/functions/delay";
import { createEmptySearch } from "~/types/search";
import { createEmptySelection } from "~/types/selection";

// TODO
export async function action({
  request,
}: Route.ActionArgs) {
  let formData = await request.formData();
  // console.log("TODO", formData.get("locationLatitude"));
  // TODO creates the search
  await delay(3000);
  const search = createEmptySearch();
  return redirect(search.toUrl());
}
