export function isGeolocationSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.geolocation;
}

const LOCATION_TIMEOUT_IN_MILLIS = 10_000;
export function getDeviceLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (isGeolocationSupported()) {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: LOCATION_TIMEOUT_IN_MILLIS,
          maximumAge: 0
        }
      );
    } else {
      reject(new Error("Geolocation not supported"));
    }
  });
}

