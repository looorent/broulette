import type { Preference } from "@features/search";
import { logger } from "@features/utils/logger";

const STORAGE_KEY = "broulette_preferences";
const STORAGE_VERSION = 2;

interface StoredPreferences {
  version: number;
  distanceRangeId: string;
  avoidFastFood: boolean;
  avoidTakeaway: boolean;
  onlyHighRated: boolean;
  location:
    | { type: "device" }
    | { type: "address"; label: { display: string; compact: string }; coordinates: { latitude: number; longitude: number } };
}

export function savePreferences(preference: Preference): void {
  try {
    const stored: StoredPreferences = createStoredPreferences(preference);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (e) {
    logger.warn("[Local Storage] Failure when storing preferences. Ignoring.", e);
  }
}

export function loadPreferences(): StoredPreferences | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredPreferences;
      return parsed.version !== STORAGE_VERSION ? null : parsed;
    } else {
      return null;
    }
  } catch (e) {
    logger.warn("[Local Storage] Failure when reading preferences. Ignoring.", e);
    return null;
  }
}

function createStoredPreferences(preference: Preference): StoredPreferences {
  return {
    version: STORAGE_VERSION,
    distanceRangeId: preference.range.id,
    avoidFastFood: preference.avoidFastFood,
    avoidTakeaway: preference.avoidTakeaway,
    onlyHighRated: preference.onlyHighRated,
    location: preference.location.isDeviceLocation
      ? { type: "device" }
      : {
        type: "address",
        label: preference.location.label,
        coordinates: preference.location.coordinates!,
      },
  };
}

