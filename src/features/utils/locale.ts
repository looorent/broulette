export const DEFAULT_LANGUAGE = "en";
export function convertLocaleToLanguage(text: string): string {
  try {
    const locale = new Intl.Locale(text);
    return [locale.language, locale.script]
      .filter(Boolean)
      .join("-");
  } catch (error) {
    console.warn(`An error occurred during conversion of locale '${text}' to language. Returning '${DEFAULT_LANGUAGE}'`, error);
    return DEFAULT_LANGUAGE;
  }
}

export function convertLocaleToSnakecase(text: string): string {
  try {
    const locale = new Intl.Locale(text);
    return [locale.language, locale.script?.toUpperCase()]
      .filter(Boolean)
      .join("_");
  } catch (error) {
    console.warn(`An error occurred during conversion of locale '${text}' to snakecase. Returning '${DEFAULT_LANGUAGE}'`, error);
    return DEFAULT_LANGUAGE;
  }
}



