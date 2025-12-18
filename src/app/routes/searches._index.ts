import prisma from "@features/db.server/prisma";
import { createServiceDatetime, createServiceEnd } from "@features/search";
import { DistanceRange, ServiceTimeslot } from "@persistence/client";
import { data, href, redirect } from "react-router";
import type { Route } from "./+types/searches._index";

// GET -> noop
export async function loader() {
  return redirect(href("/"));
}

// POST
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const validation = validateSearchInput(formData);

  if (!validation.success) {
    return data({ errors: validation.errors }, { status: 400 });
  } else {
    const { data: validData } = validation;
    const createdSearch = await prisma.search.create({
      data: {
        latitude: validData.latitude,
        longitude: validData.longitude,
        serviceDate: validData.date,
        serviceTimeslot: validData.timeslot,
        serviceInstant: createServiceDatetime(validData.date, validData.timeslot),
        serviceEnd: createServiceEnd(validData.date, validData.timeslot),
        distanceRange: validData.distanceRange,
        exhausted: false
      }
    });
    return redirect(href("/searches/:searchId", { searchId: createdSearch.id }));
  }
}

function validateSearchInput(formData: FormData) {
  const errors: Record<string, string> = {};

  const rawDate = formData.get("serviceDate")?.toString() ?? "";
  const rawLatitude = Number(formData.get("locationLatitude"))?.toString() ?? "";
  const rawLongitude = Number(formData.get("locationLongitude"))?.toString() ?? "";
  const timeslot = formData.get("serviceTimeslot") as ServiceTimeslot;
  const distanceRange = formData.get("distanceRangeId") as DistanceRange;

  const date = new Date(Date.parse(rawDate))
  const latitude = parseFloat(rawLatitude);
  const longitude = parseFloat(rawLongitude);

  if (isNaN(date.getTime())) {
    errors.serviceDate = "Invalid date";
  }

  if (isNaN(latitude) || latitude < -90 || latitude > 90) {
    errors.locationLatitude = "Latitude must be between -90 and 90.";
  }

  if (isNaN(longitude) || longitude < -180 || longitude > 180) {
    errors.locationLongitude = "Longitude must be between -180 and 180.";
  }

  if (!Object.values(ServiceTimeslot).includes(timeslot)) {
    errors.serviceTimeslot = "Invalid timeslot";
  }

  if (!Object.values(DistanceRange).includes(distanceRange)) {
    errors.distanceRangeId = "Invalid range";
  };

  if (Object.keys(errors).length > 0) {
    return { success: false, errors } as const;
  } else {
    return {
      success: true,
      data: { date: date!, latitude, longitude, timeslot, distanceRange }
    } as const;
  }
}
