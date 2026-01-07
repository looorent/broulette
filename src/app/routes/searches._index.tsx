import { DistanceRange, ServiceTimeslot } from "@persistence";
import { data, href, redirect } from "react-router";

import { ErrorUnknown } from "@components/error/error-unknown";
import { validateCSRF } from "@features/session.server";

import type { Route } from "./+types/searches._index";

// GET -> noop
export async function loader() {
  return redirect(href("/"));
}

// POST
export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  console.log("[POST /searches] Creating search with payload...", formData);
  await validateCSRF(formData, request.headers, context.sessionStorage);
  const data = parseAndValidate(formData);
  console.log("[POST /searches] Saving new search in database...", data);
  try {
    const createdSearch = await context.repositories.search.create(data.latitude, data.longitude, data.date, data.timeslot, data.distanceRange);
    console.log("[POST /searches] Search created with id:", createdSearch.id);
    return redirect(href("/searches/:searchId", { searchId: createdSearch.id }));
  } catch(e) {
    console.log("[POST /searches] Failed when creating new search in database", e);
    throw e;
  }
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
