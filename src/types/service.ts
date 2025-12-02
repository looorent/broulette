import { CalendarPlus, Clock, Moon, Sun, UtensilsCrossed, type LucideProps } from "lucide-react";

export enum ServiceTimeslot {
  Dinner = "dinner",
  Lunch = "lunch",
  RightNow = "right_now"
}

export interface ServicePreference {
  id: string;
  label: string;
  icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
  date: Date;
  timeslot: ServiceTimeslot | null;
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

function createService(baseDate: Date, service: ServiceTimeslot | null, timeHour: number, label: string): ServicePreference {
  const icon = pickIcon(service);
  return {
    id: `${service}-${baseDate.toISOString().split("T")[0]}`,
    label: label,
    icon: pickIcon(service),
    date: createMoment(baseDate, timeHour),
    timeslot: service
  };
};

const DEFAULT_LUNCH_TIME = 12;
const DEFAULT_DINNER_TIME = 19;
export function createNextServices(now: Date = new Date()): ServicePreference[] {
  const currentHour = now.getHours();

  const services = [
    createService(now, ServiceTimeslot.RightNow, currentHour, "Right now")
  ];

  if (currentHour < DEFAULT_LUNCH_TIME) {
    services.push(createService(now, ServiceTimeslot.Lunch, DEFAULT_LUNCH_TIME, "Today lunch"));
  }

  if (currentHour < DEFAULT_DINNER_TIME) {
    services.push(createService(now, ServiceTimeslot.Dinner, DEFAULT_LUNCH_TIME, "Today dinner"));
  }

  return [
    ...services,
    createService(addDay(now, 1), ServiceTimeslot.Lunch, now.getHours(), "Tomorrow lunch"),
    createService(addDay(now, 1), ServiceTimeslot.Dinner, now.getHours(), "Tomorrow dinner"),
    createService(addDay(now, 2), null, now.getHours(), "Pick a date"),
  ].filter(Boolean);
}
