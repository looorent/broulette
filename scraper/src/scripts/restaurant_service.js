import crypto from "node:crypto";

function findRestaurantByOverpassId(restaurants, overpassId) {
    return restaurants?.find(restaurant => restaurant.overpass?.id === overpassId) || null;
}

function completeRestaurantWithOverpass(restaurant, overpassRestaurants) {
    const matchingOverpassRestaurant = overpassRestaurants.find(overpassRestaurant => overpassRestaurant?.id === restaurant.overpass?.id) || null;
    restaurant.overpass = matchingOverpassRestaurant || restaurant.overpass || null;
    return restaurant;
}

export function completeRestaurantsWithOverpass(existingRestaurants, overpassRestaurants) {
    const restaurants = structuredClone(existingRestaurants || [])
    const missingOverpassRestaurants = overpassRestaurants.filter(overpassRestaurant => !findRestaurantByOverpassId(existingRestaurants, overpassRestaurant.id)); 

    return [
        ...restaurants.map(restaurant => completeRestaurantWithOverpass(restaurant, overpassRestaurants)),
        ...missingOverpassRestaurants.map(missingOverpassRestaurant => {
            return {
                id: crypto.randomUUID(),
                overpass: missingOverpassRestaurant
            };
        })
    ];
}

export function completeMetadataWithOverpass(existingMetadata, overpassResponse) {
    const metadata = structuredClone(existingMetadata || {});
    metadata.overpass = overpassResponse;
    return metadata;
}
