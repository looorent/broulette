import { redirect } from "react-router";
import { delay } from "~/functions/delay";
import { createDefaultCandidate } from "~/types/candidate";
import type { Route } from "../../+types/root";
import prisma from "~/functions/db/prisma.server";

// TODO start a new search in the session
export async function action({
  request,
}: Route.ActionArgs) {
  let formData = await request.formData();
  await delay(5000);

  const search = await prisma.search.findUnique({
    where: {
      id: formData.get("searchId")?.toString()
    },
    include: {
      candidates: {
        select: {
          // TODO
        }
      }
    }
  });

  const candidate = createDefaultCandidate(search.id);
  return redirect(candidate.toUrl());
}
