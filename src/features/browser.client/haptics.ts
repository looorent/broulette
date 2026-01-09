export function isHapticsSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.vibrate;
}

export function triggerHaptics() {
  if (isHapticsSupported()) {
    const vibrated = navigator.vibrate([10, 30, 10]);
    if (!vibrated) {
      console.warn("Haptics failed.");
    } else {
      console.debug("Haptics triggered!");
    }
  }
};
