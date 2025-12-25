import { CircleQuestionMark, Clock, ClockAlert } from "lucide-react";

import type { OpeningHoursOfTheDay } from "@features/view";

interface OpeningHoursCardProps {
  openingHoursOfTheDay: OpeningHoursOfTheDay | undefined;
  className?: string;
}

export function OpeningHoursCard({
  openingHoursOfTheDay,
  className = ""
}: OpeningHoursCardProps) {
  if (openingHoursOfTheDay) {
    return (
      <div
        className={`
          my-3 inline-flex -rotate-1 transform items-center gap-1.5 rounded-lg
          border-2 border-fun-dark px-3 py-1.5 font-sans text-sm font-bold
          tracking-wide text-fun-dark uppercase shadow-hard-hover select-none
          ${openingHoursOfTheDay.unknown ? "bg-fun-yellow" : ""}
          ${openingHoursOfTheDay.open === false ? "bg-fun-red/20 text-fun-red" : ""}
          ${className}
        `}
        role="alert"
      >
        {
          openingHoursOfTheDay.unknown ? (
            <CircleQuestionMark className="h-5 w-5 stroke-[2.5px]" />
          ) : openingHoursOfTheDay.open ? (
            <Clock className="h-5 w-5 stroke-[2.5px]" />
          ) : (
            <ClockAlert className="h-5 w-5 stroke-[2.5px]" />
          )
        }

        <span className="text-xs">
          {!openingHoursOfTheDay.unknown && <strong>{openingHoursOfTheDay.dayLabel}:</strong>}
          &nbsp;
          {openingHoursOfTheDay.hoursLabel || ""}
        </span>
      </div>
    );
  } else {
    return null;
  }
}
