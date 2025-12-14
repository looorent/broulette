import prisma from "@features/db.server/prisma";
import { createServiceDatetime, createServiceEnd } from "@features/search";
import { buildUrlForSearch } from "@features/search.server";
import type { DistanceRange, ServiceTimeslot } from "@persistence/client";
import { redirect } from "react-router";
import type { Route } from "./+types/searches._index";

export async function action({
  request,
}: Route.ActionArgs) {
  const formData = await request.formData();
  // TODO manage validation & errors

  const timeslot = formData.get("serviceTimeslot")?.toString() as keyof typeof ServiceTimeslot;
  const date = new Date(Date.parse(formData.get("serviceDate")?.toString() ?? "")); // TODO ugly
  const createdSearch = await prisma.search.create({
    data: {
      latitude: Number(formData.get("locationLatitude")),
      longitude: Number(formData.get("locationLongitude")),
      serviceDate: date,
      serviceTimeslot: timeslot,
      serviceInstant: createServiceDatetime(date, timeslot),
      serviceEnd: createServiceEnd(date, timeslot),
      distanceRange: formData.get("distanceRangeId")?.toString() as keyof typeof DistanceRange,
      exhausted: false
    }
  });

  return redirect(buildUrlForSearch(createdSearch.id));
}

export async function loader() {
  return redirect("/");
}
