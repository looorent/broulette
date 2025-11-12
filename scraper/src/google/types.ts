import { protos } from "@googlemaps/places";

export class GoogleRestaurantSearchResult {
  static fromPlaceId(placeId: string | undefined, searchedAt: Date): GoogleRestaurantSearchResult {
    return new GoogleRestaurantSearchResult(
      placeId,
      undefined,
      searchedAt
    );
  }

  static empty(now: Date): GoogleRestaurantSearchResult {
    return new GoogleRestaurantSearchResult(
      undefined,
      undefined,
      now
    );
  }

  constructor(
    readonly placeId: string | undefined,
    readonly place: GoogleRestaurant | undefined,
    readonly searchedAt: Date
  ) {}

  withPlaceDetail(placeDetail: GoogleRestaurant | undefined, searchedAt: Date): GoogleRestaurantSearchResult {
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
    readonly businessStatus: (protos.google.maps.places.v1.Place.BusinessStatus | keyof typeof protos.google.maps.places.v1.Place.BusinessStatus | null),
    readonly priceLevel: (protos.google.maps.places.v1.PriceLevel | keyof typeof protos.google.maps.places.v1.PriceLevel | null),
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
    readonly raw: any) { }

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
}
