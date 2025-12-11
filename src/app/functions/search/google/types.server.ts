import { protos } from "@googlemaps/places";

export class GoogleRestaurantSearchResult {
  static fromPlaceId(
    placeId: string | undefined,
    searchedAt: Date
  ): GoogleRestaurantSearchResult {
    return new GoogleRestaurantSearchResult(placeId, undefined, searchedAt);
  }

  static empty(now: Date): GoogleRestaurantSearchResult {
    return new GoogleRestaurantSearchResult(undefined, undefined, now);
  }

  constructor(
    readonly placeId: string | undefined,
    readonly place: GoogleRestaurant | undefined,
    readonly searchedAt: Date
  ) {}

  withPlaceDetail(
    placeDetail: GoogleRestaurant | undefined,
    searchedAt: Date
  ): GoogleRestaurantSearchResult {
    return new GoogleRestaurantSearchResult(
      this.placeId,
      placeDetail?.clone(),
      searchedAt
    );
  }

  clone(): GoogleRestaurantSearchResult {
    return new GoogleRestaurantSearchResult(
      this.placeId,
      this.place?.clone() || undefined,
      this.searchedAt ? new Date(this.searchedAt.getTime()) : new Date()
    );
  }

  asHash(): any {
    return {
      placeId: this.placeId,
      place: this.place?.asHash(),
      searchedAt: this.searchedAt
    };
  }
}

export class GoogleRestaurant {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly types: string[],
    readonly nationalPhoneNumber: string,
    readonly internationalPhoneNumber: string,
    readonly formattedAddress: string,
    readonly addressComponents: protos.google.maps.places.v1.Place.IAddressComponent[],
    readonly location: protos.google.type.ILatLng,
    readonly viewport: protos.google.geo.type.IViewport,
    readonly rating: number,
    readonly googleMapsUri: string,
    readonly websiteUri: string,
    readonly regularOpeningHours: protos.google.maps.places.v1.Place.IOpeningHours,
    readonly utcOffsetMinutes: number,
    readonly adrFormatAddress: string,
    readonly businessStatus:
      | protos.google.maps.places.v1.Place.BusinessStatus
      | keyof typeof protos.google.maps.places.v1.Place.BusinessStatus
      | null,
    readonly priceLevel:
      | protos.google.maps.places.v1.PriceLevel
      | keyof typeof protos.google.maps.places.v1.PriceLevel
      | null,
    readonly userRatingCount: number,
    readonly iconMaskBaseUri: string,
    readonly iconBackgroundColor: string,
    readonly displayName: protos.google.type.ILocalizedText,
    readonly primaryTypeDisplayName: protos.google.type.ILocalizedText,
    readonly takeout: boolean,
    readonly delivery: boolean,
    readonly dineIn: boolean,
    readonly reservable: boolean,
    readonly servesBreakfast: boolean,
    readonly servesLunch: boolean,
    readonly servesDinner: boolean,
    readonly servesBeer: boolean,
    readonly servesWine: boolean,
    readonly servesBrunch: boolean,
    readonly servesVegetarianFood: boolean,
    readonly currentOpeningHours: protos.google.maps.places.v1.Place.IOpeningHours,
    readonly primaryType: string,
    readonly shortFormattedAddress: string,
    readonly photos: protos.google.maps.places.v1.IPhoto[],
    readonly raw: any
  ) {}

  clone(): GoogleRestaurant {
    return new GoogleRestaurant(
      this.id,
      this.name,
      this.types,
      this.nationalPhoneNumber,
      this.internationalPhoneNumber,
      this.formattedAddress,
      this.addressComponents,
      this.location,
      this.viewport,
      this.rating,
      this.googleMapsUri,
      this.websiteUri,
      this.regularOpeningHours,
      this.utcOffsetMinutes,
      this.adrFormatAddress,
      this.businessStatus,
      this.priceLevel,
      this.userRatingCount,
      this.iconMaskBaseUri,
      this.iconBackgroundColor,
      this.displayName,
      this.primaryTypeDisplayName,
      this.takeout,
      this.delivery,
      this.dineIn,
      this.reservable,
      this.servesBreakfast,
      this.servesLunch,
      this.servesDinner,
      this.servesBeer,
      this.servesWine,
      this.servesBrunch,
      this.servesVegetarianFood,
      this.currentOpeningHours,
      this.primaryType,
      this.shortFormattedAddress,
      this.photos,
      this.raw
    );
  }

  asHash(): any {
    return {
      id: this.id,
      name: this.name,
      types: this.types,
      nationalPhoneNumber: this.nationalPhoneNumber,
      internationalPhoneNumber: this.internationalPhoneNumber,
      formattedAddress: this.formattedAddress,
      addressComponents: this.addressComponents,
      location: this.location,
      viewport: this.viewport,
      rating: this.rating,
      googleMapsUri: this.googleMapsUri,
      websiteUri: this.websiteUri,
      regularOpeningHours: this.regularOpeningHours,
      utcOffsetMinutes: this.utcOffsetMinutes,
      adrFormatAddress: this.adrFormatAddress,
      businessStatus: this.businessStatus,
      priceLevel: this.priceLevel,
      userRatingCount: this.userRatingCount,
      iconMaskBaseUri: this.iconMaskBaseUri,
      iconBackgroundColor: this.iconBackgroundColor,
      displayName: this.displayName,
      primaryTypeDisplayName: this.primaryTypeDisplayName,
      takeout: this.takeout,
      delivery: this.delivery,
      dineIn: this.dineIn,
      reservable: this.reservable,
      servesBreakfast: this.servesBreakfast,
      servesLunch: this.servesLunch,
      servesDinner: this.servesDinner,
      servesBeer: this.servesBeer,
      servesWine: this.servesWine,
      servesBrunch: this.servesBrunch,
      servesVegetarianFood: this.servesVegetarianFood,
      currentOpeningHours: this.currentOpeningHours,
      primaryType: this.primaryType,
      shortFormattedAddress: this.shortFormattedAddress,
      photos: this.photos,
      raw: this.raw
    };
  }

  toPriceLevelAsNumber(): number | null {
    switch (this.priceLevel) {
      case "PRICE_LEVEL_INEXPENSIVE":
        return 1;
      case "PRICE_LEVEL_MODERATE":
        return 2;
      case "PRICE_LEVEL_EXPENSIVE":
        return 3;
      case "PRICE_LEVEL_VERY_EXPENSIVE":
        return 4;
      case "PRICE_LEVEL_FREE":
        return 0;
      case "PRICE_LEVEL_UNSPECIFIED":
      default:
        return null;
    }
  }

  // TODO review
  toOsmOpeningHours(): string | null {
    if (this.regularOpeningHours?.periods && this.regularOpeningHours?.periods?.length > 0) {
      const periods = this.regularOpeningHours?.periods;

      const is247 = periods.length === 1 &&
        periods[0].open?.day === 0 &&
        periods[0].open?.minute === 0 &&
        !periods[0].close; // TODO review this

      return null;

      // if (is247) {
      //   return "24/7";
      // } else {
      //   const dayScheduleMap = new Map<number, string[]>();
      //   for (const period of periods) {
      //     // If close is missing (rare outside 24/7), we skip or treat as open-end.
      //     // OSM strictness usually requires a close time or 24/7. Skipping invalid entries for safety.
      //     if (!period.close) continue;

      //     const day = period.open!.day;
      //     const openTime = formatTime(period.open?.time);
      //     const closeTime = formatTime(period.close?.time);
      //     const interval = `${openTime}-${closeTime}`;

      //     if (!dayScheduleMap.has(day)) {
      //       dayScheduleMap.set(day, []);
      //     }
      //     dayScheduleMap.get(day)!.push(interval);
      //   }
      //   const scheduleToDaysMap = new Map<string, number[]>();
      //   dayScheduleMap.forEach((intervals, day) => {
      //     // Join multiple intervals for the day with comma (handling split hours)
      //     const signature = intervals.join(",");

      //     if (!scheduleToDaysMap.has(signature)) {
      //       scheduleToDaysMap.set(signature, []);
      //     }
      //     scheduleToDaysMap.get(signature)!.push(day);
      //   });

      //   const osmParts: string[] = [];
      //   for (const [signature, days] of scheduleToDaysMap.entries()) {
      //     const dayRangeString = formatDayGrouping(days);
      //     osmParts.push(`${dayRangeString} ${signature}`);
      //   }
      //   return osmParts.join("; ");
      // }
    } else {
      return null;
    }
  }
}

// const DAY_MAP: Record<number, string> = {
//   0: "Su", 1: "Mo", 2: "Tu", 3: "We", 4: "Th", 5: "Fr", 6: "Sa"
// };

// /**
//  * Helper: Formats "1730" to "17:30"
//  */
// function formatTime(time: string): string {
//   if (time.length !== 4) return time; // Fallback
//   return `${time.substring(0, 2)}:${time.substring(2)}`;
// }

// /**
//  * Helper: Converts an array of day integers [1, 2, 3, 5] into OSM string "Mo-We,Fr"
//  */
// function formatDayGrouping(days: number[]): string {
//   // Sort days numerically
//   days.sort((a, b) => a - b);

//   const groups: string[] = [];
//   if (days.length === 0) return "";

//   let start = days[0];
//   let prev = days[0];

//   for (let i = 1; i < days.length; i++) {
//     const current = days[i];

//     // Check if consecutive
//     if (current === prev + 1) {
//       prev = current;
//     } else {
//       // Gap found, push the previous group
//       groups.push(buildRangeString(start, prev));
//       start = current;
//       prev = current;
//     }
//   }
//   // Push the final group
//   groups.push(buildRangeString(start, prev));

//   return groups.join(",");
// }

// /**
//  * Helper: Builds "Mo-We" or "Mo" or "Mo,Tu" string
//  */
// function buildRangeString(start: number, end: number): string {
//   const startDay = DAY_MAP[start];
//   const endDay = DAY_MAP[end];

//   if (start === end) {
//     return startDay;
//   } else if (end === start + 1) {
//     // For 2 days, comma is often cleaner, but hyphen is valid.
//     // Standard OSM often uses "Mo,Tu" for adjacent pairs, but "Mo-Tu" is technically valid syntax.
//     // We will use hyphen for ranges of 2 or more for consistency.
//     return `${startDay}-${endDay}`;
//   } else {
//     return `${startDay}-${endDay}`;
//   }
// }
