export async function shareSocial(title: string, description: string, url: string) {
  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: description,
        url: url
      });
    } catch (error) {
      console.warn("Error sharing or user canceled:", error);
    }
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(url);
  }
}
