import { copyToClipboard, isClipboardSupported } from "./clipboard";

export function isSharingSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.share;
}

export async function shareSocial(
  title: string | undefined | null,
  description: string | undefined | null,
  url: string
) {
  if (isSharingSupported()) {
    try {
      await navigator.share({
        title: title ?? "",
        text: description ?? "",
        url: url
      });
    } catch (error) {
      console.warn("Error sharing or user canceled:", error);
    }
  } else if (isClipboardSupported()) {
    copyToClipboard(url);
  } else {
    // TODO console.warn
  }
}
