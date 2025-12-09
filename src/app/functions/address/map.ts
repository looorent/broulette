export function createMapLink(location: {
  latitude: number,
  longitude: number
}, name: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}&query_place_id=${encodeURIComponent(name || "") }`;
};
