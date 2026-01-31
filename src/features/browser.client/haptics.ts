import { logger } from "@features/utils/logger";

export function isHapticsSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.vibrate;
}

export function triggerHaptics() {
  if (isHapticsSupported()) {
    const vibrated = navigator.vibrate([10, 30, 10]);
    if (!vibrated) {
      logger.warn("Haptics failed.");
    } else {
      logger.debug("Haptics triggered!");
    }
  }
};
