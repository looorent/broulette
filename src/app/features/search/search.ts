import type { Search } from "@persistence/client";
import { formatDistance } from "./distance";
import { formatServiceTime } from "./service";

export function formatSearchLabel({ serviceTimeslot, serviceInstant, distanceRange }: Search): string {
  return [
    formatServiceTime(serviceTimeslot, serviceInstant),
    formatDistance(distanceRange)
  ].filter(Boolean).join(" - ");
}

