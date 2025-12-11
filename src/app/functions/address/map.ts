export function createMapLink(
  latitude: number,
  longitude: number,
  name: string
): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&query_place_id=${encodeURIComponent(name || "") }`;
};
