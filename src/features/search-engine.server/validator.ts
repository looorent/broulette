import { buildViewModelOfRestaurant } from "@features/view.server/factory";
import type { Search , RestaurantAndProfiles, SearchCandidateRejectionReason } from "@persistence";

const SUCCESS = {
  valid: true
};

const FAST_FOOD_TAGS = new Set([
  "fast_food",
  "fastfood",
  "friture",
  "friterie",
  "kebab",
  "sandwich_shop"
]);

function failed(reason: SearchCandidateRejectionReason | null = null): RestaurantValidation {
  return {
    valid: false,
    rejectionReason: reason
  };
}

export interface RestaurantValidation {
  valid: boolean;
  rejectionReason?: SearchCandidateRejectionReason | null;
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
      if (model.openingHoursOfTheDay?.unknown === true) {
        return failed("unknown_opening_hours");
      } else if (model.openingHoursOfTheDay?.open === false) {
        return failed("closed");
      } else if (!model.imageUrl) {
        return failed("no_image");
      } else if (search.avoidFastFood && model.tags.some(tag => FAST_FOOD_TAGS.has(tag.id))) {
        return failed("fast_food");
      } else {
        return SUCCESS;
      }
    }
  } else {
    return failed("no_restaurant_found");
  }
}
