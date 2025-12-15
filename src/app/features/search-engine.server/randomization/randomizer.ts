import type { DiscoveredRestaurant } from "../discovery/scanner";

export async function randomize(restaurants: DiscoveredRestaurant[]): Promise<DiscoveredRestaurant[]> {
  const shuffled = [...restaurants];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
