import { redirect } from "react-router";
import { delay } from "~/functions/delay";
import { createEmptySearch } from "~/types/search";
import type { Route } from "../../+types/root";

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
