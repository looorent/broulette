import { ServiceTimeslot } from "@persistence/enums";
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
    icon: pickIcon(timeslot),
    date: createServiceDatetime(baseDate, timeslot),
    timeslot: timeslot,
    isAvailable: isAvailable
  };
};

// TODO we should move that to the server side
export const SERVICE_DEFAULTS = {
  [ServiceTimeslot.Lunch]: {
    start:  { hour: 11, minute: 30 },
    middle: { hour: 12, minute: 30 },
    end:    { hour: 14, minute: 30 }
  },
  [ServiceTimeslot.Dinner]: {
    start:  { hour: 18, minute: 0 },
    middle: { hour: 19, minute: 30 },
    end:    { hour: 22, minute: 0 }
  }
} as const;

export function createServiceDatetime(day: Date, timeslot: ServiceTimeslot | null): Date {
  const date = new Date(day);
  switch (timeslot) {
    case ServiceTimeslot.Lunch:
    case ServiceTimeslot.Dinner:
      const hour = SERVICE_DEFAULTS[timeslot].middle.hour;
      const minute = SERVICE_DEFAULTS[timeslot].middle.hour;
      date.setHours(hour, minute, 0);
    case ServiceTimeslot.RightNow:
      return new Date();
    case ServiceTimeslot.Custom:
      return date;
    default:
      return new Date();
  }
}

export function createServiceEnd(day: Date, timeslot: ServiceTimeslot | null): Date {
  const date = new Date(day);
  switch (timeslot) {
    case ServiceTimeslot.Lunch:
    case ServiceTimeslot.Dinner:
      const hour = SERVICE_DEFAULTS[timeslot].end.hour;
      const minute = SERVICE_DEFAULTS[timeslot].end.hour;
      date.setHours(hour, minute, 0);
      return date;
    case ServiceTimeslot.RightNow:
      const tomorrow = addDay(date, 1)
      tomorrow.setHours(0, 0, 0);
      return tomorrow;
    case ServiceTimeslot.Custom:
      return new Date(date.getTime() + 60 * 60 * 1000);
    default:
      return new Date(date.getTime() + 60 * 60 * 1000);
  }
}

export function createNextServices(now: Date = new Date()): ServicePreference[] {
  const currentHour = now.getHours();

  const services = [
    createService(now, ServiceTimeslot.RightNow, "Right now", "Now")
  ];

  if (currentHour < SERVICE_DEFAULTS[ServiceTimeslot.Lunch].middle.hour) {
    services.push(createService(now, ServiceTimeslot.Lunch, "Today lunch", "Lunch"));
  }

  if (currentHour < SERVICE_DEFAULTS[ServiceTimeslot.Dinner].middle.hour) {
    services.push(createService(now, ServiceTimeslot.Dinner, "Today dinner", "Dinner"));
  }

  return [
    ...services,
    createService(addDay(now, 1), ServiceTimeslot.Lunch, "Tomorrow lunch", "Tmw lunch"),
    createService(addDay(now, 1), ServiceTimeslot.Dinner, "Tomorrow dinner", "Tmw dinner"),
    createService(addDay(now, 2), null, "Pick a date", "Some day", false),
  ].filter(Boolean);
}

function addDay(originalDate: Date, numberOfDays: number): Date {
  const newDate = new Date(originalDate);
  newDate.setDate(newDate.getDate() + numberOfDays);
  return newDate;
}

function pickIcon(timeslot: ServiceTimeslot | null): ServicePreferenceIcon {
  switch (timeslot) {
    case ServiceTimeslot.RightNow:
      return "clock";
    case ServiceTimeslot.Dinner:
      return "moon";
    case ServiceTimeslot.Lunch:
      return "sun";
    default:
      return "calendar";
  }
}
