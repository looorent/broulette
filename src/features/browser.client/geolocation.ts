export function isGeolocationSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.geolocation;
}

export async function getGeolocationPermissionStatus(): Promise<PermissionState | "unknown"> {
  if (typeof navigator !== "undefined" && navigator.permissions && navigator.permissions.query) {
    try {
      const permissionStatus = await navigator.permissions.query({ name: "geolocation" });
      return permissionStatus.state;
    } catch {
      return "unknown";
    }
  } else {
    return "unknown";
  }
}

const HIGH_ACCURACY_TIMEOUT_IN_MS = 5_000;
const LOW_ACCURACY_TIMEOUT_IN_MS = 10_000;
const CACHED_POSITION_AGE_IN_MS = 60_000;

export function getDeviceLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (isGeolocationSupported()) {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        () => {
          navigator.geolocation.getCurrentPosition(
            (position) => resolve(position),
            (errorHigh) => {
              if (errorHigh.code === errorHigh.TIMEOUT || errorHigh.code === errorHigh.POSITION_UNAVAILABLE) {
                navigator.geolocation.getCurrentPosition(
                  (position) => resolve(position),
                  (errorLow) => reject(errorLow),
                  {
                    enableHighAccuracy: false,
                    timeout: LOW_ACCURACY_TIMEOUT_IN_MS,
                    maximumAge: 0
                  }
                );
              } else {
                reject(errorHigh);
              }
            },
            {
              enableHighAccuracy: true,
              timeout: HIGH_ACCURACY_TIMEOUT_IN_MS,
              maximumAge: 0
            }
          );
        },
        {
          enableHighAccuracy: false,
          timeout: 1_000,
          maximumAge: CACHED_POSITION_AGE_IN_MS
        }
      );
    } else {
      reject(new Error("Geolocation not supported"));
    }
  });
}
