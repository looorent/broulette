import { buildViewModelOfRestaurant } from "@features/view.server/factory";
import type { Prisma, Search } from "@persistence/client";

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

type RestaurantAndProfiles = Prisma.RestaurantGetPayload<{
  include: {
    profiles: true;
  }
}>;

// TODO add other validations?
export async function validateRestaurant(restaurant: RestaurantAndProfiles, search: Search, locale: string): Promise<RestaurantValidation> {
  if (restaurant.latitude === null || restaurant.latitude === undefined || restaurant.longitude === null || restaurant.longitude === undefined) {
    return failed("missing_coordinates");
  } else {
    const model = buildViewModelOfRestaurant(restaurant, search, locale);
    if (model.openingHoursOfTheDay?.open === false) {
      return failed("closed");
    } else {
      return SUCCESS;
    }
  }
}
