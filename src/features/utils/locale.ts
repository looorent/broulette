import { logger } from "./logger";

export const DEFAULT_LANGUAGE = "en";
export function convertLocaleToLanguage(text: string): string {
  try {
    const locale = new Intl.Locale(text);
    return [locale.language, locale.script]
      .filter(Boolean)
      .join("-");
  } catch (error) {
    logger.warn("An error occurred during conversion of locale '%s' to language. Returning '%s' %s", text, DEFAULT_LANGUAGE, error);
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
    logger.warn("An error occurred during conversion of locale '%s' to snakecase. Returning '%s' %s", text, DEFAULT_LANGUAGE, error);
    return DEFAULT_LANGUAGE;
  }
}



