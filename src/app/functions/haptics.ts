export function triggerHaptics() {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate([200, 100, 200]);
  }
};
