import type { OpeningHoursOfTheDay } from "@features/view";
import { CircleQuestionMark, Clock, ClockAlert } from "lucide-react";

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
          inline-flex items-center gap-1.5
          px-3 py-1.5
          my-5
           text-fun-dark
          border-2 border-fun-dark
          rounded-lg
          shadow-hard-hover
          transform -rotate-1
          font-bold font-sans text-sm uppercase tracking-wide
          select-none
          ${openingHoursOfTheDay.unknown ? "bg-fun-yellow text-fun-dark" : ""}
          ${openingHoursOfTheDay.open === false ? "bg-fun-red/20 text-fun-red" : ""}
          ${className}
        `}
        role="alert"
      >
        {
          openingHoursOfTheDay.unknown ? (
            <CircleQuestionMark className="w-5 h-5 stroke-[2.5px]" />
          ) : openingHoursOfTheDay.open ? (
            <Clock className="w-5 h-5 stroke-[2.5px]" />
          ) : (
            <ClockAlert className="w-5 h-5 stroke-[2.5px]" />
          )
        }

        <span className="text-xs">
          {!openingHoursOfTheDay.unknown && <strong>{openingHoursOfTheDay.dayLabel}:</strong>}
          {openingHoursOfTheDay.hoursLabel || ""}
        </span>
      </div>
    );
  } else {
    return null;
  }
}
