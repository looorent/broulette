import { triggerHaptics } from "@features/browser.client";
import type { Preference } from "@features/search";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import type { loader as rootLoader } from "app/root";
import { Form, useRouteLoaderData, useSubmit } from "react-router";

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
        csrf: session?.csrfToken ?? ""
      }, {
        action: "/searches",
        method: "post",
        replace: false, // we want to keep the main "/" state in the history
        viewTransition: true
      });
    }
  };

  return (
    <Form
      method="post"
      action="/searches"
      onSubmit={handleSubmit}
      className={`
        w-full
        flex justify-center items-center
        mb-14 mt-auto
        ${className}
      `}
    >
      {/* Decorative Pulse */}
      <div className={`
          absolute w-56 h-56 rounded-full pointer-events-none z-0
          animate-pulse-mega transition-colors duration-500
          bg-fun-cream/30
        `}
        aria-hidden="true"
      />

      <button
        type="submit"
        aria-label={hasErrors ? "Form incomplete, click for details" : "Start Search"}
        className={`
          group relative w-48 h-48 rounded-full border-[6px]
          flex flex-col items-center justify-center z-20
          transition-all duration-300 ease-out
          ${isBuzzing ? "animate-buzz bg-fun-red border-2 border-fun-cream border-dashed" : ""}
          ${showErrors && !isBuzzing ? "bg-slate-100 text-slate-400 border-2 border-slate-200 border-dashed hover:bg-slate-200" : ""}
          ${!showErrors ? "bg-fun-cream border-fun-dark shadow-hard hover:translate-y-0.5 hover:shadow-hard-hover active:scale-95 cursor-pointer" : ""}
        `}
      >
        <span className={`
            font-pop text-4xl uppercase tracking-wider transition-all duration-300
            ${showErrors
              ? "text-gray-300 decoration-4 decoration-red-400/50 blur-[0.5px]"
              : "text-fun-dark"
            }
          `}>
          feed me
        </span>

        {showErrors && (
          <div className="
            absolute -top-1 -right-1
            rotate-12 group-hover:rotate-25 group-hover:scale-110
            transition-all duration-200 ease-spring
          ">
            <AlertTriangle className="w-14 h-14 text-fun-dark fill-fun-yellow stroke-[2.5px] drop-shadow-md" />
          </div>
        )}
      </button>
    </Form>
  );
}
