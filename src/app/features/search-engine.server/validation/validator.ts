import type { Restaurant } from "@persistence/client";
import { isOpenAtTarget } from "./opening-hours";

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

export async function validateRestaurant(restaurant: Restaurant, instant: Date): Promise<RestaurantValidation> {
  if (restaurant.latitude === null || restaurant.latitude === undefined || restaurant.longitude === null || restaurant.longitude === undefined) {
    return failed("missing_coordinates");
  } else if (isOpenAtTarget(restaurant.openingHours, restaurant.latitude, restaurant.longitude, restaurant.countryCode, restaurant.state, instant) === false) {
    return failed("closed");
  } else {
    return SUCCESS;
  }
}
