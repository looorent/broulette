import type { OpeningHoursOfTheDay } from "@features/view";
import opening_hours from "opening_hours";

export function formatOpeningHoursFor(
  instant: Date,
  osmOpeningHours: string | undefined | null,
  locale: string = "en-US"
): OpeningHoursOfTheDay {
  if (osmOpeningHours && osmOpeningHours.length > 0) {
    try {
      const oh = new opening_hours(osmOpeningHours);
      const from = new Date(instant);
      from.setHours(0, 0, 0, 0);
      const dayLabel = formatDay(from);
      const to = new Date(from);
      to.setDate(to.getDate() + 1);
      return {
        open: oh.getState(instant),
        unknown: false,
        dayLabel: dayLabel,
        hoursLabel: formatHours(oh, from, to, locale)
      }
    } catch (error) {
      console.error(`Invalid opening_hours string: "${osmOpeningHours}"`, error);
      return {
        unknown: true,
        open: undefined,
        dayLabel: "",
        hoursLabel: "Unknown opening hours :("
      };
    }
  } else {
    return {
      unknown: true,
      open: undefined,
      dayLabel: "",
      hoursLabel: "Unknown opening hours :("
    };
  }
}

function formatIntervals(
  intervals: [Date, Date, boolean, string | undefined][],
  from: Date,
  to: Date,
  locale: string
): string[] {
  return intervals.map((interval) => {
    const start = interval[0];
    const end = interval[1];
    if (start.getTime() <= from.getTime() && end.getTime() >= to.getTime()) {
      return "Open 24 hours";
    } else {
      return `${formatTime(start, locale)} - ${formatTime(end, locale)}`;
    }
  });
}

function formatDay(date: Date, locale: string = "en-US"): string {
  return date.toLocaleDateString(locale, { weekday: "long" });
}

function formatTime(
  date: Date,
  locale: string = "en-US"
): string {
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
};

function formatHours(
  openingHours: opening_hours,
  from: Date,
  to: Date,
  locale: string = "en-US"
): string {
  const intervals = openingHours.getOpenIntervals(from, to);
  if (intervals.length === 0) {
    return "Closed";
  } else {
    const formattedIntervals = formatIntervals(intervals, from, to, locale);
    if (formattedIntervals.includes("Open 24 hours")) {
      return "Open 24 hours";
    } else {
      return formattedIntervals.join(", ");
    }
  }
}
