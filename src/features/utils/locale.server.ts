// For now, I use en-US only
export async function getLocale(_request: Request): Promise<string> {
  return "en-US";
}
