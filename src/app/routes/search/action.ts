import { redirect } from "react-router";
import prisma from "~/functions/db/prisma";
import { buildUrlForSearch } from "~/functions/url";
import type { DistanceRange, ServiceTimeslot } from "~/generated/prisma/enums";
import type { Route } from "./+types/action";

export async function action({
  request,
}: Route.ActionArgs) {
  const formData = await request.formData();
  // TODO manage validation & errors
  const createdSearch = await prisma.search.create({
    data: {
      latitude: Number(formData.get("locationLatitude")),
      longitude: Number(formData.get("locationLongitude")),
      serviceDate: formData.get("serviceDate")?.toString() || "",
      serviceTimeslot: formData.get("serviceTimeslot")?.toString() as keyof typeof ServiceTimeslot,
      distanceRange: formData.get("distanceRangeId")?.toString() as keyof typeof DistanceRange,
    }
  });

  return redirect(buildUrlForSearch(createdSearch.id));
}
