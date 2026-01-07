import { buildViewModelOfRestaurant } from "@features/view.server/factory";
import type { Search , RestaurantAndProfiles } from "@persistence";


const SUCCESS = {
  valid: true
};

function failed(reason: string | null = null): RestaurantValidation {
  return {
    valid: false,
    rejectionReason: reason
  };
}

export interface RestaurantValidation {
  valid: boolean;
  rejectionReason?: string | null;
}

export async function validateRestaurant(
  restaurant: RestaurantAndProfiles | undefined,
  search: Search,
  locale: string
): Promise<RestaurantValidation> {
  if (restaurant) {
    if (restaurant.latitude === null || restaurant.latitude === undefined || restaurant.longitude === null || restaurant.longitude === undefined) {
      return failed("missing_coordinates");
    } else {
      const model = buildViewModelOfRestaurant(restaurant, search, locale)!;
      if (model.openingHoursOfTheDay?.open === false) {
        return failed("closed");
      } else {
        return SUCCESS;
      }
    }
  } else {
    return failed("no_restaurant_found");
  }
}
