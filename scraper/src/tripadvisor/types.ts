const MILES_100_METERS = 0.062;

export class TripAdvisorSearchResult {
  static empty(searchedAt: Date): TripAdvisorSearchResult {
    return new TripAdvisorSearchResult(undefined, undefined, [], searchedAt);
  }

  static fromLocationSearch(locationsFound: TripAdvisorLocationSearchResult[], searchedAt: Date): TripAdvisorSearchResult {
    const locationsFoundAndOrderedByDistance = locationsFound?.filter(Boolean)?.filter(location => location.isCloserThan(MILES_100_METERS))?.toSorted((a, b) => a.compareTo(b)) || [];
    const bestLocationFound = locationsFoundAndOrderedByDistance?.[0];
    return new TripAdvisorSearchResult(
      bestLocationFound?.locationId,
      undefined,
      locationsFoundAndOrderedByDistance,
      searchedAt
    );
  }

  constructor(
    readonly locationId: number | undefined,
    readonly location: TripAdvisorLocation | undefined,
    readonly locationsFoundNearby: TripAdvisorLocationSearchResult[] | undefined,
    readonly searchedAt: Date
  ) {}

  withLocationDetail(locationDetail: TripAdvisorLocation | undefined, searchedAt: Date): TripAdvisorSearchResult {
    return new TripAdvisorSearchResult(
      this.locationId,
      locationDetail?.clone(),
      this.locationsFoundNearby?.filter(Boolean)?.map(location => location.clone()) || undefined,
      searchedAt
    );
  }

  clone(): TripAdvisorSearchResult {
    return new TripAdvisorSearchResult(
      this.locationId,
      this.location?.clone() || undefined,
      this.locationsFoundNearby?.filter(Boolean)?.map(location => location.clone()) || undefined,
      new Date(this.searchedAt.getTime())
    );
  }
  
  asHash(): any {
    return {
      locationId: this.locationId,
      location: this.location?.asHash(),
      locationsFoundNearby: this.locationsFoundNearby?.map(location => location.asHash()),
      searchedAt: this.searchedAt
    };
  }
}

export class TripAdvisorLocationSearchResult {
  constructor(readonly locationId: number,
              readonly name: string,
              readonly distance: number,
              readonly bearing: string,
              readonly address: any) {}
  
  clone(): TripAdvisorLocationSearchResult {
    return new TripAdvisorLocationSearchResult(
      this.locationId,
      this.name,
      this.distance,
      this.bearing,
      structuredClone(this.address)
    );
  }

  asHash(): any {
    return {
      locationId: this.locationId,
      name: this.name,
      distance: this.distance,
      bearing: this.bearing,
      address: this.address
    };
  }

  compareTo(other: TripAdvisorLocationSearchResult): number {
    return this.distance - other.distance;
  }

  isCloserThan(distanceInMiles: number): boolean {
    return this.distance < distanceInMiles;
  }
}

export class TripAdvisorLocation {
  constructor(
    readonly locationId: number,
    readonly name: string,
    readonly webUrl: string,
    readonly addressObj: {
      street1: string;
      city: string;
      state: string;
      country: string;
      postalcode: string;
      addressString: string;
    },
    readonly ancestors: {
      level: string;
      name: string;
      locationId: string;
    }[],
    readonly latitude: number,
    readonly longitude: number,
    readonly timezone: string,
    readonly email: string,
    readonly phone: string,
    readonly website: string,
    readonly writeReview: string,
    readonly rankingData: {
      geoLocationId: string;
      rankingString: string;
      geoLocationName: string;
      rankingOutOf: number;
      ranking: number;
    },
    readonly rating: number,
    readonly ratingImageUrl: string,
    readonly numReviews: number,
    readonly reviewRatingCount: Record<string, number>,
    readonly subratings: {
      name: string;
      localizedName: string;
      ratingImageUrl: string;
      value: number;
    }[],
    readonly photoCount: number,
    readonly seeAllPhotos: string,
    readonly priceLevel: string,
    readonly hours: {
      periods: {
        open: { day: number; time: string };
        close: { day: number; time: string };
      }[];
      weekdayText: string[];
    },
    readonly features: string[],
    readonly cuisine: { name: string; localizedName: string }[],
    readonly category: { name: string; localizedName: string },
    readonly subcategory: { name: string; localizedName: string }[],
    readonly tripTypes: { name: string; localizedName: string; value: number }[],
    readonly awards: any[]
  ) {}

  clone(): TripAdvisorLocation {
    return new TripAdvisorLocation(
      this.locationId,
      this.name,
      this.webUrl,
      structuredClone(this.addressObj),
      structuredClone(this.ancestors),
      this.latitude,
      this.longitude,
      this.timezone,
      this.email,
      this.phone,
      this.website,
      this.writeReview,
      structuredClone(this.rankingData),
      this.rating,
      this.ratingImageUrl,
      this.numReviews,
      structuredClone(this.reviewRatingCount),
      structuredClone(this.subratings),
      this.photoCount,
      this.seeAllPhotos,
      this.priceLevel,
      structuredClone(this.hours),
      structuredClone(this.features),
      structuredClone(this.cuisine),
      structuredClone(this.category),
      structuredClone(this.subcategory),
      structuredClone(this.tripTypes),
      structuredClone(this.awards)
    );
  }

  asHash(): any {
    return new TripAdvisorLocation(
      this.locationId,
      this.name,
      this.webUrl,
      this.addressObj,
      this.ancestors,
      this.latitude,
      this.longitude,
      this.timezone,
      this.email,
      this.phone,
      this.website,
      this.writeReview,
      this.rankingData,
      this.rating,
      this.ratingImageUrl,
      this.numReviews,
      this.reviewRatingCount,
      this.subratings,
      this.photoCount,
      this.seeAllPhotos,
      this.priceLevel,
      this.hours,
      this.features,
      this.cuisine,
      this.category,
      this.subcategory,
      this.tripTypes,
      this.awards
    );
  }
}

