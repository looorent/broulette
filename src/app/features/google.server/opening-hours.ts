
interface GoogleTimePoint {
  day: number;
  hour: number;
  minute: number;
  date?: { year: number; month: number; day: number };
}

interface GooglePeriod {
  open: GoogleTimePoint;
  close?: GoogleTimePoint;
}

interface GoogleOpeningHours {
  periods: GooglePeriod[];
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const OSM_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

/**
 * Converts Google Maps Places API periods to OSM opening_hours string.
 * @param regularOpeningHours - The `regularOpeningHours` object from the Google Place result
 */
export function convertGooglePeriodsToOpeningHours(regularOpeningHours: GoogleOpeningHours): string | undefined {
  const periods = regularOpeningHours.periods;

  if (!periods || periods.length === 0) {
    return undefined;
  } else if (periods.length === 1 && !periods[0].close && periods[0]?.open?.day === 0 && isZeroTime(periods[0].open)) {
    return "24/7";
  } else {
    const daySchedule = periods.reduce<Record<number, string[]>>((intervalsPerDay, period) => {
      const isCorrupted = !period || !period.close && periods.length > 1;
      if (!isCorrupted && period?.open?.day !== null && period?.open?.day !== undefined) {
        const { day } = period.open;
        const start = formatTime(period.open);
        const end = period.close ? formatTime(period.close) : "24:00";
        const interval = `${start}-${end}`;
        return {
          ...intervalsPerDay,
          [day]: [...(intervalsPerDay[day] || []), interval]
        };
      } else {
        return intervalsPerDay;
      }
    }, {});

    const scheduleGroups = OSM_DAY_ORDER.reduce<Record<string, number[]>>((intervalsPerGroup, dayIndex) => {
      const intervals = daySchedule[dayIndex];
      if (intervals) {
        const groupId = intervals.join(",");
        if (!intervalsPerGroup[groupId]) {
          intervalsPerGroup[groupId] = [];
        }
        intervalsPerGroup[groupId].push(dayIndex);
        return intervalsPerGroup;
      } else {
        return intervalsPerGroup;
      }
    }, {});

    return Object.entries(scheduleGroups)
      .map(([hours, days]) => `${formatDayRange(days, DAYS)} ${hours}`)
      .join("; ");
  }
}

function isZeroTime(time: GoogleTimePoint | null): boolean {
  return typeof time?.hour === "number"
    && time.hour === 0
    && time.minute === 0;
}

function formatTime(time: GoogleTimePoint | null | undefined): string {
  if (time && typeof time.hour === "number" && typeof time.minute === "number") {
    const hour = time.hour.toString().padStart(2, "0");
    const minute = time.minute.toString().padStart(2, "0");
    return `${hour}:${minute}`;
  } else {
    return "0000";
  }
}

function formatDayRange(indices: number[], dayNames: string[]): string {
  if (indices.length === 0) {
    return "";
  } else {
    const ranges = indices.reduce<{ start: number; end: number }[]>((acc, current) => {
      const lastGroup = acc[acc.length - 1];
      if (!lastGroup) {
        return [{ start: current, end: current }];
      } else {
        const prev = lastGroup.end;
        const isAdjacent = (current === prev + 1) || (prev === 6 && current === 0);
        if (isAdjacent) {
          lastGroup.end = current;
          return acc;
        } else {
          return [...acc, { start: current, end: current }];
        }
      }
    }, []);

    return ranges
      .map(range => formatSingleRange(range.start, range.end, dayNames))
      .join(",");
  }
}

function formatSingleRange(start: number, end: number, dayNames: string[]): string {
  return start === end
    ? dayNames[start]
    : `${dayNames[start]}-${dayNames[end]}`;
}
