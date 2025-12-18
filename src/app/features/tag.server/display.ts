const RESTAURANT_LABELS: Record<string, string> = {
  // --- Regional / Ethnic ---
  afghani: "Afghani",
  african: "African",
  american: "American",
  asian: "Asian",
  brazilian: "Brazilian",
  chinese: "Chinese",
  french: "French",
  greek: "Greek",
  indian: "Indian",
  indonesian: "Indonesian",
  italian: "Italian",
  japanese: "Japanese",
  korean: "Korean",
  lebanese: "Lebanese",
  mediterranean: "Mediterranean",
  mexican: "Mexican",
  middle_eastern: "Middle Eastern",
  spanish: "Spanish",
  thai: "Thai",
  turkish: "Turkish",
  vietnamese: "Vietnamese",

  // --- Food Types ---
  barbecue: "BBQ",
  breakfast: "Breakfast",
  brunch: "Brunch",
  buffet: "Buffet",
  dessert: "Dessert",
  dessert_shop: "Desserts",
  fast_food: "Fast Food",
  fine_dining: "Fine Dining",
  hamburger: "Burgers",
  pizza: "Pizza",
  ramen: "Ramen",
  seafood: "Seafood",
  steak_house: "Steakhouse",
  sushi: "Sushi",
  vegan: "Vegan",
  vegetarian: "Vegetarian",
  friture: "Fry",

  // --- Venues / Service ---
  bar_and_grill: "Bar & Grill",
  meal_delivery: "Delivery",
  meal_takeaway: "Takeaway",
  pub: "Pub",
  restaurant: "Restaurant",
};

export function tagToLabel(tag: string): { id: string; label: string } {
  return {
    id: tag,
    label: RESTAURANT_LABELS[tag] || createDefaultLabel(tag)
  };
}

function createDefaultLabel(tag: string): string {
  return tag
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
}

