import type { RestaurantIdentity } from "@persistence/client";

const SOURCES_FOR_DISCOVERY = new Set(["osm"]);
export function findSourceIn(identities: RestaurantIdentity[] = []): string | undefined {
  const preferredIdentity = identities.find(id => !SOURCES_FOR_DISCOVERY.has(id.source));
  const selectedIdentity = preferredIdentity ?? identities[0];
  return selectedIdentity?.source;
}
