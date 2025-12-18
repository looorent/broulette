import opening_hours from "opening_hours";

const DEFAULT_COUNTRY_CODE = "be";

export function isOpenAtTarget(
  openingHours: string | null | undefined,
  latitude: number,
  longitude: number,
  countryCode: string | undefined | null,
  state: string | undefined | null,
  instant: Date
): boolean | null {
  if (!openingHours) {
    return null;
  } else {
    try {
      return new opening_hours(openingHours, {
        lat: latitude,
        lon: longitude,
        address: {
          country_code: countryCode?.toLowerCase() ?? DEFAULT_COUNTRY_CODE,
          state: state ?? ""
        }
      }).getState(instant);
    } catch (e) {
      console.error(`Opening hours parsing failed for input '${openingHours}' and country code '${countryCode}'`, openingHours, e);
      return null;
    }
  }
}
