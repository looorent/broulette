import type { DistanceRange, ServiceTimeslot } from "prisma/generated/prisma/enums";
import { redirect } from "react-router";
import prisma from "~/db/prisma";
import type { Route } from "../../+types/root";

export async function action({
  request,
}: Route.ActionArgs) {
  let formData = await request.formData();
  // TODO manage validation & errors
  console.log("searching...");
  const createdSearch = await prisma.search.create({
    data: {
      latitude: Number(formData.get("locationLatitude")),
      longitude: Number(formData.get("locationLongitude")),
      serviceDate: formData.get("serviceDate")?.toString() || "",
      serviceTimeslot: formData.get("serviceTimeslot")?.toString() as keyof typeof ServiceTimeslot,
      distanceRange: formData.get("distanceRangeId")?.toString() as keyof typeof DistanceRange,
    }
  });

  console.log("createdSearch", createdSearch);

  // return redirect(createdSearch.toUrl());
  return redirect(`/searches/${createdSearch.id}`);
}
