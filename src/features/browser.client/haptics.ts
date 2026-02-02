export function isHapticsSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.vibrate;
}

export function triggerHaptics() {
  if (isHapticsSupported()) {
    navigator.vibrate(50);
  }
};
