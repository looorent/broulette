import type { Route } from "./+types/search";

export default function Search(
    { params }: Route.ComponentProps
) {
  return params.searchId;
}
