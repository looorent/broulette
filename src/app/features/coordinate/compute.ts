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
