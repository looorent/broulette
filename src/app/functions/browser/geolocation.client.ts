export function isGeolocationSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.geolocation;
}

export function getDeviceLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (isGeolocationSupported()) {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      reject(new Error("Geolocation not supported"));
    }
  });
}

