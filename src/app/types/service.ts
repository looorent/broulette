import { CalendarPlus, Clock, Moon, Sun, type LucideProps } from "lucide-react";

export enum ServiceTimeslot {
  Dinner = "Dinner",
  Lunch = "Lunch",
  RightNow = "RightNow"
}

export interface ServicePreference {
  id: string;
  label: {
    display: string;
    compact: string;
  };
  icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
  date: Date;
  timeslot: ServiceTimeslot | null;
  isAvailable: boolean;
}

function createMoment(baseDate: Date, hour: number): Date {
  const date = new Date(baseDate);
  date.setHours(hour, 0, 0, 0);
  return date;
};

function addDay(originalDate: Date, numberOfDays: number): Date {
  const newDate = new Date(originalDate);
  newDate.setDate(newDate.getDate() + numberOfDays);
  return newDate;
}

function pickIcon(timeslot: ServiceTimeslot | null): React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>> {
  switch (timeslot) {
    case ServiceTimeslot.RightNow:
      return Clock;
    case ServiceTimeslot.Dinner:
      return Moon;
    case ServiceTimeslot.Lunch:
      return Sun;
    default:
      return CalendarPlus;
  }
}

function createService(baseDate: Date, service: ServiceTimeslot | null, timeHour: number, labelDisplay: string, labelCompact: string, isAvailable: boolean = true): ServicePreference {
  const icon = pickIcon(service);
  return {
    id: `${service}-${baseDate.toISOString().split("T")[0]}`,
    label: {
      display: labelDisplay,
      compact: labelCompact
    },
    icon: pickIcon(service),
    date: createMoment(baseDate, timeHour),
    timeslot: service,
    isAvailable: isAvailable
  };
};

const DEFAULT_LUNCH_TIME = 12;
const DEFAULT_DINNER_TIME = 19;
export function createNextServices(now: Date = new Date()): ServicePreference[] {
  const currentHour = now.getHours();

  const services = [
    createService(now, ServiceTimeslot.RightNow, currentHour, "Right now", "Now")
  ];

  if (currentHour < DEFAULT_LUNCH_TIME) {
    services.push(createService(now, ServiceTimeslot.Lunch, DEFAULT_LUNCH_TIME, "Today lunch", "Lunch"));
  }

  if (currentHour < DEFAULT_DINNER_TIME) {
    services.push(createService(now, ServiceTimeslot.Dinner, DEFAULT_LUNCH_TIME, "Today dinner", "Dinner"));
  }

  return [
    ...services,
    createService(addDay(now, 1), ServiceTimeslot.Lunch, now.getHours(), "Tomorrow lunch", "Tmw lunch"),
    createService(addDay(now, 1), ServiceTimeslot.Dinner, now.getHours(), "Tomorrow dinner", "Tmw dinner"),
    createService(addDay(now, 2), null, now.getHours(), "Pick a date", "Some day", false),
  ].filter(Boolean);
}
