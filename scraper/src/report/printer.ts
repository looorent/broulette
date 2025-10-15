import { Catalog } from "../catalog/catalog";

export function reportRestaurantsWithoutOverpassName(catalog: Catalog): Catalog {

    const restaurantsWithoutOverpassName = catalog.restaurants.filter(restaurant => !restaurant.hasOverpassName());

    if (restaurantsWithoutOverpassName.length > 0) {
        console.warn(`[Highlight] ${restaurantsWithoutOverpassName.length} restaurants do not have an Overpass name`, restaurantsWithoutOverpassName.map(restaurant => restaurant.id));
    }

    return catalog;
}

export function reportRestaurantsMatchedWithGoogle(catalog: Catalog): Catalog {
    const matches = catalog.restaurants.filter(restaurant => restaurant.hasGoogleRestaurant());
    const mismatches = catalog.restaurants.filter(restaurant => !restaurant.hasGoogleRestaurant());

    console.info(`[Highlight] ${matches.length} restaurants have been matched with Google`);
    if (mismatches.length > 0) {
        console.warn(`[Highlight] ${mismatches.length} restaurants have NOT been matched with Google`);
    }

    return catalog;
}