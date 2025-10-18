import { Catalog } from "../catalog/catalog";

export function reportRestaurantsWithoutOverpassName(catalog: Catalog): Catalog {

    const restaurantsWithoutOverpassName = catalog.restaurants.filter(restaurant => !restaurant.hasOverpassName());

    if (restaurantsWithoutOverpassName.length > 0) {
        console.warn(`[Highlight] ${restaurantsWithoutOverpassName.length} restaurants do not have an Overpass name`, restaurantsWithoutOverpassName.map(restaurant => restaurant.id));
    }

    return catalog;
}

export function reportRestaurantsMatchedWithGoogle(catalog: Catalog): Catalog {
    const matches = catalog.restaurants.filter(restaurant => restaurant.hasGoogleRestaurantId());
    const mismatches = catalog.restaurants.filter(restaurant => !restaurant.hasGoogleRestaurantId());

    console.info(`[Highlight] ${matches.length} restaurants have been matched with Google`);
    if (mismatches.length > 0) {
        console.warn(`[Highlight] ${mismatches.length} restaurants have NOT been matched with Google`);
    }

    return catalog;
}

export function reportRestaurantsMatchedWithGoogleWithoutTheDetails(catalog: Catalog): Catalog {
    const matches = catalog.restaurants.filter(restaurant => restaurant.hasGoogleRestaurantId());

    const restaurantsWithIdOnly = matches.filter(restaurant => !restaurant.hasGoogleRestaurant());

    if (restaurantsWithIdOnly.length > 0) {
        console.warn(`[Highlight] ${restaurantsWithIdOnly.length} restaurants have been matched with Google but their details has not been loaded yet (for cost reasons).`);
    } else {
        console.info(`[Highlight] All ${matches.length} restaurants matched with Google have their details loaded.`);
    }

    return catalog;
}