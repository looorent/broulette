export function thirtyDaysAgo(): Date {
  const result = new Date();
  result.setDate(result.getDate() - 30);
  return result;
}

const TWO_MONTHS_IN_MS = 2 * 30 * 24 * 60 * 60 * 1000;
export function isOlderThanTwoMonths(date: Date): boolean {
  const timeDifference = Date.now() - date.getTime();
  return timeDifference > TWO_MONTHS_IN_MS;
}

export function computeMonthBounds(date: Date): { start: Date, end: Date } {
  const year = date.getFullYear();
  const month = date.getMonth();

  return {
    start: new Date(year, month, 1),
    end: new Date(year, month + 1, 1)
  };
}
