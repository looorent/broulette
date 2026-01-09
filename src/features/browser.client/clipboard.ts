export function isClipboardSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.clipboard;
}

export function copyToClipboard(text: string) {
  if (isClipboardSupported()) {
    navigator.clipboard.writeText(text);
  }
}
