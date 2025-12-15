export function thirtyDaysAgo(): Date {
  const result = new Date();
  result.setDate(result.getDate() - 30);
  return result;
}

export function isOlderThanAMonth(date: Date): boolean {
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
  const timeDifference = Date.now() - date.getTime();
  return timeDifference > thirtyDaysInMs;
}
