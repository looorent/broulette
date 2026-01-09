import { CalendarPlus, Clock, Moon, Sun, type LucideProps } from "lucide-react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

import type { ServiceTimeslot } from "@persistence";


export type ServicePreferenceIcon = "clock" | "moon" | "sun" | "calendar";
export interface ServicePreference {
  id: string;
  label: {
    display: string;
    compact: string;
  };
  iconName: ServicePreferenceIcon;
  date: Date;
  timeslot: ServiceTimeslot | null;
  isAvailable: boolean;
}

function createService(
  baseDate: Date,
  timeslot: ServiceTimeslot | null,
  labelDisplay: string,
  labelCompact: string,
  isAvailable: boolean = true
): ServicePreference {
  return {
    id: `${timeslot}-${baseDate.toISOString().split("T")[0]}`,
    label: {
      display: labelDisplay,
      compact: labelCompact
    },
    iconName: pickIcon(timeslot),
    date: createServiceDatetime(baseDate, timeslot),
    timeslot: timeslot,
    isAvailable: isAvailable
  };
};

export const SERVICE_DEFAULTS = {
  ["Lunch"]: {
    start:  { hour: 11, minute: 30 },
    middle: { hour: 12, minute: 30 },
    end:    { hour: 14, minute: 30 }
  },
  ["Dinner"]: {
    start:  { hour: 18, minute: 0 },
    middle: { hour: 19, minute: 30 },
    end:    { hour: 22, minute: 0 }
  }
} as const;


const SERVICE_ICONS = {
  calendar: CalendarPlus,
  sun: Sun,
  moon: Moon,
  clock: Clock
} as const;

export function findIconFor(service: ServicePreference): ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>> {
  if (service) {
    return SERVICE_ICONS[service.iconName] || CalendarPlus;
  } else {
    return CalendarPlus;
  }
}

export function createServiceDatetime(day: Date, timeslot: ServiceTimeslot | null): Date {
  const date = new Date(day);
  switch (timeslot) {
    case "Lunch":
    case "Dinner": {
      const hour = SERVICE_DEFAULTS[timeslot].middle.hour;
      const minute = SERVICE_DEFAULTS[timeslot].middle.minute;
      date.setHours(hour, minute, 0, 0);
      return date;
    }
    case "RightNow":
      return new Date();
    case "Custom":
      return date;
    default:
      return new Date();
  }
}

export function createServiceEnd(day: Date, timeslot: ServiceTimeslot | null): Date {
  const date = new Date(day);
  switch (timeslot) {
    case "Lunch":
    case "Dinner": {
      const hour = SERVICE_DEFAULTS[timeslot].end.hour;
      const minute = SERVICE_DEFAULTS[timeslot].end.minute;
      date.setHours(hour, minute, 0, 0);
      return date;
    }
    case "RightNow": {
      const tomorrow = addDay(date, 1)
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow;
    }
    case "Custom":
      return new Date(date.getTime() + 60 * 60 * 1000);
    default:
      return new Date(date.getTime() + 60 * 60 * 1000);
  }
}

function getServiceTime(baseDate: Date, time: { hour: number, minute: number }): Date {
  const date = new Date(baseDate);
  date.setHours(time.hour, time.minute, 0, 0);
  return date;
}

export function createNextServices(now: Date = new Date()): ServicePreference[] {
  const services: ServicePreference[] = [];

  const isDuringLunch = now >= getServiceTime(now, SERVICE_DEFAULTS.Lunch.start) && now < getServiceTime(now, SERVICE_DEFAULTS.Lunch.end);
  const isDuringDinner = now >= getServiceTime(now, SERVICE_DEFAULTS.Dinner.start) && now < getServiceTime(now, SERVICE_DEFAULTS.Dinner.end);

  if (isDuringLunch) {
    services.push(createService(now, "Lunch", "Today lunch", "Lunch"));
  } else if (isDuringDinner) {
    services.push(createService(now, "Dinner", "Today dinner", "Dinner"));
  } else {
    services.push(createService(now, "RightNow", "Right now", "Now"));
  }

  if (now < getServiceTime(now, SERVICE_DEFAULTS.Lunch.start)) {
    services.push(createService(now, "Lunch", "Today lunch", "Lunch"));
  }

  if (now < getServiceTime(now, SERVICE_DEFAULTS.Dinner.start)) {
    services.push(createService(now, "Dinner", "Today dinner", "Dinner"));
  }

  const tomorrow = addDay(now, 1);
  const afterTomorrow = addDay(now, 2);

  return [
    ...services,
    createService(tomorrow, "Lunch", "Tomorrow lunch", "Tmw lunch"),
    createService(tomorrow, "Dinner", "Tomorrow dinner", "Tmw dinner"),
    createService(afterTomorrow, null, "Pick a date", "Some day", false),
  ];
}

function addDay(originalDate: Date, numberOfDays: number): Date {
  const newDate = new Date(originalDate);
  newDate.setDate(newDate.getDate() + numberOfDays);
  return newDate;
}

function pickIcon(timeslot: ServiceTimeslot | null): ServicePreferenceIcon {
  switch (timeslot) {
    case "RightNow":
      return "clock";
    case "Dinner":
      return "moon";
    case "Lunch":
      return "sun";
    default:
      return "calendar";
  }
}
