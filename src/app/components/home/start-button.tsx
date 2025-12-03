import { useEffect } from "react";
import { useFetcher } from "react-router";
import type { Preference } from "~/types/preference";

export const SEARCH_FETCHER = "search-fetcher";

interface StartButtonProps {
  preferences: Preference;
  className?: string;
}

export default function StartButton({ preferences, className = "" } : StartButtonProps) {
  const fetcher = useFetcher({ key: SEARCH_FETCHER });
  useEffect(() => {
    console.log("TODO preferences", preferences);
  }, [preferences?.id]);
  return (
    <fetcher.Form method="post"
      action="/searches"
      className={`w-full flex justify-center items-center mb-14 mt-auto ${className}`}>
      <div className="absolute w-56 h-56 bg-fun-cream/30 rounded-full animate-pulse-mega pointer-events-none z-0" aria-hidden="true"></div>

      <button className="group relative w-48 h-48 bg-fun-cream rounded-full border-[6px] border-fun-dark shadow-hard transition-all duration-200 hover:translate-y-0.5 hover:shadow-hard-hover active:scale-95 flex flex-col items-center justify-center gap-2 z-20 cursor-pointer"
        type="submit">
        <span className="font-pop text-4xl uppercase tracking-wider text-fun-dark">
          feed me
        </span>
      </button>
    </fetcher.Form>
  );
}
