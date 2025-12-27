import { data, href, redirect } from "react-router";

import { ErrorUnknown } from "@components/error/error-unknown";
import { getPrisma } from "@features/db.server";
import { createServiceDatetime, createServiceEnd } from "@features/search";
import { validateCSRF } from "@features/session.server";
import { DistanceRange, ServiceTimeslot } from "@persistence/client";

import type { Route } from "./+types/searches._index";

// GET -> noop
export async function loader() {
  return redirect(href("/"));
}

// POST
export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  await validateCSRF(formData, request.headers);
  const data = parseAndValidate(formData);
  const prisma = getPrisma(context.cloudflare.env);
  const createdSearch = await prisma.search.create({
    data: {
      latitude: data.latitude,
      longitude: data.longitude,
      serviceDate: data.date,
      serviceTimeslot: data.timeslot,
      serviceInstant: createServiceDatetime(data.date, data.timeslot),
      serviceEnd: createServiceEnd(data.date, data.timeslot),
      distanceRange: data.distanceRange,
      exhausted: false
    }
  });
  return redirect(href("/searches/:searchId", { searchId: createdSearch.id }));
}

function parseAndValidate(formData: FormData) {
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
    throw data({ errors: errors }, { status: 400 });
  } else {
    return {
      date: date!,
      latitude,
      longitude,
      timeslot,
      distanceRange
    } as const;
  }
}

export function ErrorBoundary({
  error,
}: Route.ErrorBoundaryProps) {
  console.error("[GET searches] Unexpected error", error);
  return (
    <ErrorUnknown />
  );
}
