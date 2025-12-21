import type { LocationHours, OperatingPeriod } from "./types";

const DAY_MAP: { [key: number]: string } = {
  1: "Mo",
  2: "Tu",
  3: "We",
  4: "Th",
  5: "Fr",
  6: "Sa",
  7: "Su",
  0: "Su" // fallback
};

function formatTime(isoTime: string): string {
  if (!isoTime || isoTime.length !== 4) {
    return isoTime
  } else {
    return `${isoTime.substring(0, 2)}:${isoTime.substring(2, 4)}`;
  }
}

function toTimeRange(p: OperatingPeriod): string {
  return p.open && p.close
    ? `${formatTime(p.open.time)}-${formatTime(p.close.time)}`
    : "00:00-24:00";
}

function formatDayRange(days: number[]): string {
  const sorted = [...days].sort((a, b) => a - b);
  const ranges = sorted.reduce<number[][]>((acc, day) => {
    const currentRange = acc[acc.length - 1];
    if (currentRange && day === currentRange[currentRange.length - 1] + 1) {
      return [...acc.slice(0, -1), [...currentRange, day]];
    } else {
      return [...acc, [day]];
    }
  }, []);

  return ranges.map(r =>
    r.length > 2
    ? `${DAY_MAP[r[0]]}-${DAY_MAP[r[r.length - 1]]}`
    : r.length === 2
      ? `${DAY_MAP[r[0]]},${DAY_MAP[r[1]]}`
      : DAY_MAP[r[0]]
  ).join(",");
};

export function convertTripAdvisorHoursToOpeningHours(hours: LocationHours | undefined): string | undefined {
  return (hours?.periods ?? [])
    .filter((period): period is OperatingPeriod & { open: { day: number, time: string } } => !!period.open)
    .map(period => ({
      day: period.open.day,
      range: toTimeRange(period)
    }))
    .reduce((rangeAndDays, { day, range }) => {
      const existing = rangeAndDays.find(group => group.range === range);
      return existing
        ? rangeAndDays.map(g => g.range === range ? { ...g, days: [...g.days, day] } : g)
        : [...rangeAndDays, { range, days: [day] }];
    }, [] as { range: string; days: number[] }[])
    .map(({ range, days }) => `${formatDayRange(days)} ${range}`)
    .join("; ") || undefined;
}
