import type { Coordinates, MapRectangleViewPort } from "./types";

// Earth's radius in meters (WGS84)
const EARTH_RADIUS = 6378137;

/**
 * Uses WGS84
 */
export function computeViewportFromCircle(
  center: Coordinates,
  radiusMeters: number
): MapRectangleViewPort {
  const latitudeOffset = radiusMeters / EARTH_RADIUS * (180 / Math.PI);
  const longitudeOffset = radiusMeters / (EARTH_RADIUS * Math.cos((Math.PI * center.latitude) / 180)) * (180 / Math.PI);

  return {
    bottomLeft: {
      latitude: center.latitude - latitudeOffset,
      longitude: center.longitude - longitudeOffset
    },
    topRight: {
      latitude: center.latitude + latitudeOffset,
      longitude: center.longitude + longitudeOffset
    }
  };
}

export function computeDistanceInMeters(from: Coordinates, to: Coordinates): number {
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);

  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS * c);
}

function toRad(value: number) {
  return (value * Math.PI) / 180;
}
