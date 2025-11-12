import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { OverpassResponse, OverpassRestaurant } from "../overpass/types";
import { Catalog, Restaurant } from "./catalog";
import {
  GoogleRestaurant,
  GoogleRestaurantSearchResult
} from "../google/types";
import {
  TripAdvisorLocation,
  TripAdvisorLocationSearchResult,
  TripAdvisorSearchResult
} from "../tripadvisor/types";

const LATEST_FILE_NAME = process.env["LATEST_FILE_NAME"] || "latest.json";

function formatTimestamp() {
  const iso = new Date().toISOString();
  const date = iso.slice(0, 10).replace(/-/g, "");
  const time = iso.slice(11, 19).replace(/:/g, "");
  return `${date}_${time}`;
}

function parseCatalogFromStorage(json: any): Catalog | undefined {
  if (json) {
    return new Catalog(
      json.version,
      parseOverpassResponseFromStorage(json.overpass),
      json.restaurants
        ?.map(parseCatalogRestaurantsFromStorage)
        ?.filter(Boolean) || []
    );
  } else {
    return undefined;
  }
}

function parseOverpassResponseFromStorage(
  json: any
): OverpassResponse | undefined {
  if (json) {
    return new OverpassResponse(
      json.generator,
      json.version,
      json.copyright,
      json.timestampInUtc,
      json.durationInMs,
      json.restaurants
        ?.map(parseOverpassRestaurantFromStorage)
        ?.filter(Boolean) || [],
      json.raw
    );
  } else {
    return undefined;
  }
}

function parseOverpassRestaurantFromStorage(
  json: any
): OverpassRestaurant | undefined {
  if (json) {
    return new OverpassRestaurant(
      json.id,
      json.type,
      json.name,
      json.latitude,
      json.longitude,
      json.tags,
      json.amenity
    );
  } else {
    return undefined;
  }
}

function parseGoogleRestaurantFromStorage(
  json: any
): GoogleRestaurant | undefined {
  if (json) {
    return new GoogleRestaurant(
      json.id,
      json.name,
      json.types,
      json.nationalPhoneNumber,
      json.internationalPhoneNumber,
      json.formattedAddress,
      json.addressComponents,
      json.location,
      json.viewport,
      json.rating,
      json.googleMapsUri,
      json.websiteUri,
      json.regularOpeningHours,
      json.utcOffsetMinutes,
      json.adrFormatAddress,
      json.businessStatus,
      json.priceLevel,
      json.userRatingCount,
      json.iconMaskBaseUri,
      json.iconBackgroundColor,
      json.displayName,
      json.primaryTypeDisplayName,
      json.takeout,
      json.delivery,
      json.dineIn,
      json.reservable,
      json.servesBreakfast,
      json.servesLunch,
      json.servesDinner,
      json.servesBeer,
      json.servesWine,
      json.servesBrunch,
      json.servesVegetarianFood,
      json.currentOpeningHours,
      json.primaryType,
      json.shortFormattedAddress,
      json.photos,
      json.raw
    );
  } else {
    return undefined;
  }
}

function parseCatalogGoogleSearchFromStorage(
  json: any
): GoogleRestaurantSearchResult | undefined {
  if (json) {
    return new GoogleRestaurantSearchResult(
      json.placeId,
      parseGoogleRestaurantFromStorage(json.place),
      json.searchedAt ? new Date(json.searchedAt) : new Date()
    );
  } else {
    return undefined;
  }
}

function parseCatalogTripAdvisorSearchFromStorage(
  json: any
): TripAdvisorSearchResult | undefined {
  if (json) {
    return new TripAdvisorSearchResult(
      json.locationId,
      parseTripAdvisorLocationFromStorage(json.location),
      json.locationsFoundNearby?.map(
        parseTripAdvisorLocationSearchResultFromStorage
      ),
      json.searchedAt ? new Date(json.searchedAt) : new Date()
    );
  } else {
    return undefined;
  }
}

function parseCatalogRestaurantsFromStorage(json: any): Restaurant | undefined {
  if (json) {
    return new Restaurant(
      json.id,
      parseOverpassRestaurantFromStorage(json.overpassRestaurant),
      parseCatalogGoogleSearchFromStorage(json.google),
      parseCatalogTripAdvisorSearchFromStorage(json.tripAdvisor)
    );
  } else {
    return undefined;
  }
}

function parseTripAdvisorLocationFromStorage(
  json: any
): TripAdvisorLocation | undefined {
  if (json) {
    return new TripAdvisorLocation(
      json.locationId,
      json.name,
      json.webUrl,
      json.addressObj,
      json.ancestors,
      json.latitude,
      json.longitude,
      json.timezone,
      json.email,
      json.phone,
      json.website,
      json.writeReview,
      json.rankingData,
      json.rating,
      json.ratingImageUrl,
      json.numReviews,
      json.reviewRatingCount,
      json.subratings,
      json.photoCount,
      json.seeAllPhotos,
      json.priceLevel,
      json.hours,
      json.features,
      json.cuisine,
      json.category,
      json.subcategory,
      json.tripTypes,
      json.awards
    );
  } else {
    return undefined;
  }
}

function parseTripAdvisorLocationSearchResultFromStorage(
  json: any
): TripAdvisorLocationSearchResult | undefined {
  if (json) {
    return new TripAdvisorLocationSearchResult(
      json.location,
      json.name,
      json.distance,
      json.bearing,
      json.address
    );
  } else {
    return undefined;
  }
}

export function readCatalogFromStorage(folderPath: string): Catalog {
  console.log(`Reading restaurants from storage at '${folderPath}'...`);
  const folder = resolve(folderPath);

  if (!existsSync(folder)) {
    mkdirSync(folder, { recursive: true });
  }

  const filePath = resolve(folderPath, LATEST_FILE_NAME);

  if (!existsSync(filePath)) {
    console.log(
      `Reading restaurants from storage at '${folderPath}'. File does not exist. Start from scratch.`
    );
    return Catalog.empty();
  } else {
    const catalog = parseCatalogFromStorage(
      JSON.parse(readFileSync(filePath, "utf-8"))
    );
    if (catalog) {
      console.log(
        `Reading restaurants from storage at '${folderPath}'. Done. ${catalog.numberOfRestaurants} restaurants found in version ${catalog.version}.`
      );
      return catalog;
    } else {
      console.log(
        `Reading restaurants from storage at '${folderPath}'. File does not seem to be parsed properly. Start from scratch.`
      );
      return Catalog.empty();
    }
  }
}

export function writeCatalogToStorage(
  catalog: Catalog,
  folderPath: string
): Catalog {
  const formattedData = JSON.stringify(catalog?.asHash(), null, 2);
  const timestamp = formatTimestamp();

  const outputFile = resolve(join(folderPath, `${timestamp}_output.json`));
  console.log(`Writing restaurants to storage at '${outputFile}'...`);
  writeFileSync(outputFile, formattedData, "utf-8");
  console.log(`Writing restaurants to storage at '${outputFile}': done.`);

  const latestFile = resolve(join(folderPath, "latest.json"));
  console.log(`Writing restaurants to storage at '${latestFile}'...`);
  writeFileSync(latestFile, formattedData, "utf-8");
  console.log(`Writing restaurants to storage at '${latestFile}': done.`);
  return catalog;
}
