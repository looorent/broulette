import { logger } from "@features/utils/logger";

interface GoogleMoney {
  currencyCode?: string;
  units?: string; // API returns string for int64
  nanos?: number;
}

interface GooglePriceRange {
  startPrice?: GoogleMoney;
  endPrice?: GoogleMoney;
}

interface GooglePlace {
  priceLevel?: string;
  priceRange?: GooglePriceRange;
}

export function formatPrices(place: GooglePlace): { priceLevel: number | undefined, priceLabel: string | undefined } {
  const price = convertPriceLevelToNumber(place.priceLevel);
  if (price) {
    return {
      priceLevel: price,
      priceLabel: formatPriceRangeFromNumber(price)
    };
  } else {
    return {
      priceLevel: undefined,
      priceLabel: formatPriceRangeFromRange(place.priceRange)
    };
  }
}

const DOLLAR_SIGN = "$";
function formatPriceRangeFromNumber(range: number | null | undefined): string | undefined {
  if (range === null || range === undefined) {
    return undefined;
  } else {
    return DOLLAR_SIGN.repeat(range);
  }
}

function formatPriceRangeFromRange(
  range: GooglePriceRange | null | undefined,
  locale: string = "en-US"
): string | undefined {
  if (range === null || range === undefined || (!range.startPrice && !range.endPrice)) {
    return undefined;
  } else {
    const start = range.startPrice ? formatMoney(range.startPrice, locale) : null;
    const end = range.endPrice ? formatMoney(range.endPrice, locale) : null;

    if (start && end) {
      if (start === end) return start;
      return `${start} - ${end}`
    } else if (start) {
      return `From ${start}`;
    } else if (end) {
      return `Up to ${end}`;
    } else {
      return undefined;
    }
  }
}

function formatMoney(
  money: GoogleMoney,
  locale: string = "en-US"
): string {
  const units = parseInt(money.units || "0") || 0;
  const nanos = money.nanos || 0;
  const value = units + nanos / 1_000_000_000;

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: money.currencyCode || "EUR",
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }).format(value);
  } catch (e) {
    logger.warn("Error when parsing money object '%j'. Returning '%s %s'. %s", money, value, money.currencyCode, e);
    return `${value} ${money.currencyCode}`;
  }
}

function convertPriceLevelToNumber(priceLevel: string | undefined | null): number | undefined {
  switch (priceLevel) {
    case "PRICE_LEVEL_INEXPENSIVE":
      return 1;
    case "PRICE_LEVEL_MODERATE":
      return 2;
    case "PRICE_LEVEL_EXPENSIVE":
      return 3;
    case "PRICE_LEVEL_VERY_EXPENSIVE":
      return 4;
    case "PRICE_LEVEL_FREE":
      return 0;
    case "PRICE_LEVEL_UNSPECIFIED":
    default:
      return undefined;
  }
}

const OPERATIONAL_BUSINESS_STATUS = "OPERATIONAL";
export function convertBusinessStatusToOperational(status: string | undefined | null): boolean | undefined {
  if (status) {
    return status === OPERATIONAL_BUSINESS_STATUS;
  } else {
    return undefined;
  }
}
