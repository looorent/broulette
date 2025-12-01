import { useNavigation } from "react-router";
import LoadingSpinner from "~/components/loading-spinner";
import { LoadingTitle } from "~/components/loading-title";
import type { Route } from "../+types/root";

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function action({
  request,
}: Route.ActionArgs) {
  let formData = await request.formData();
  let title = formData.get("title");
  await delay(5000);
  return "coucou";
}