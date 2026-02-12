import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Form, useRouteLoaderData, useSubmit } from "react-router";

import { AmbientPulse } from "@components/ambient-pulse";
import { triggerHaptics } from "@features/browser.client";
import type { Preference } from "@features/search";
import type { loader as rootLoader } from "src/root";

interface SearchSubmitButtonProps {
  preferences: Preference;
  onBuzzOnError?: () => void;
  className?: string;
}

export function SearchSubmitButton({
  preferences,
  onBuzzOnError,
  className = ""
}: SearchSubmitButtonProps) {
  const submit = useSubmit();
  const session = useRouteLoaderData<typeof rootLoader>("root");
  const [isBuzzing, setIsBuzzing] = useState(false);
  const hasErrors = preferences ? !preferences.isValid : false;
  const showErrors = preferences && preferences.isDeviceLocationAttempted && hasErrors;

  const triggerBuzz = () => {
    if (!isBuzzing) {
      setIsBuzzing(true);
      setTimeout(() => setIsBuzzing(false), 400);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    triggerHaptics();
    if (hasErrors) {
      triggerBuzz();
      onBuzzOnError?.();
    } else {
      submit({
        serviceDate: preferences.service.date.toISOString(),
        serviceTimeslot: preferences.service.timeslot,
        locationLatitude: preferences.location.coordinates!.latitude,
        locationLongitude: preferences.location.coordinates!.longitude,
        distanceRangeId: preferences.range.id,
        avoidFastFood: String(preferences.avoidFastFood),
        avoidTakeaway: String(preferences.avoidTakeaway),
        onlyHighRated: String(preferences.onlyHighRated),
        csrf: session?.csrfToken ?? ""
      }, {
        action: "/searches",
        method: "POST",
        replace: false, // we want to keep the main "/" state in the history
        viewTransition: true
      });
    }
  };

  return (
    <Form
      method="POST"
      action="/searches"
      onSubmit={handleSubmit}
      className={`
        mt-auto mb-14 flex w-full items-center justify-center
        ${className}
      `}
    >
      <AmbientPulse />

      <button
        type="submit"
        aria-label={hasErrors ? "Form incomplete, click for details" : "Start Search"}
        className={`
          group relative z-20 flex h-48 w-48 flex-col items-center
          justify-center rounded-full border-[6px] transition-all duration-300
          ease-out
          md:h-40 md:w-40
          ${isBuzzing ? `
            animate-buzz border-2 border-dashed border-fun-cream bg-fun-red
          ` : ""}
          ${showErrors && !isBuzzing ? `
            border-2 border-dashed border-slate-200 bg-slate-100 text-slate-400
            hover:bg-slate-200
          ` : ""}
          ${!showErrors ? `
            cursor-pointer border-fun-dark bg-fun-cream shadow-hard
            hover:translate-y-0.5 hover:shadow-hard-hover
            active:scale-95
          ` : ""}
        `}
      >
        <span className={`
          font-pop text-4xl tracking-wider uppercase transition-all duration-300
          md:text-3xl
          ${showErrors
              ? "text-gray-300 decoration-red-400/50 decoration-4 blur-[0.5px]"
              : "text-fun-dark"
            }
        `}>
          feed me
        </span>

        {showErrors && (
          <div className={`
            absolute -top-1 -right-1 rotate-12 transition-all duration-200
            group-hover:scale-110 group-hover:rotate-25
          `}>
            <AlertTriangle className={`
              h-14 w-14 fill-fun-yellow stroke-[2.5px] text-fun-dark
              drop-shadow-md
            `} />
          </div>
        )}
      </button>
    </Form>
  );
}
