import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import type { Preference } from "~/types/preference";

export const SEARCH_FETCHER = "search-fetcher";

interface StartButtonProps {
  preferences: Preference;
  className?: string;
}

export default function StartButton({ preferences, className = "" } : StartButtonProps) {
  const fetcher = useFetcher({ key: SEARCH_FETCHER });
  const [isBuzzing, setIsBuzzing] = useState(false);
  useEffect(() => {
    console.log("TODO preferences", preferences);
  }, [preferences?.id]);
  const isReady = false;
  // const isReady = !!preferences.isValid();

  const triggerBuzz = () => {
    if (!isBuzzing) {
      setIsBuzzing(true);
      setTimeout(() => setIsBuzzing(false), 400);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isReady) {
      triggerBuzz();
    } else {
      console.log("TODO submit");
      // fetcher.submit();
    }
  };

  return (
    <fetcher.Form method="post"
      action="/searches"
      onSubmit={e => handleSubmit(e)}
      className={`w-full flex justify-center items-center mb-14 mt-auto ${className}`}>
      <div className={`
          absolute w-56 h-56 rounded-full pointer-events-none z-0
          animate-pulse-mega transition-colors duration-500
          bg-fun-cream/30
        `}
        aria-hidden="true"></div>

      <button
        className={`
          group relative w-48 h-48 rounded-full border-[6px]
          flex flex-col items-center justify-center z-20
          transition-all duration-300 ease-out
          ${isBuzzing ? 'animate-buzz bg-fun-red border-2 border-fun-cream border-dashed' : ''}
          ${!isReady && !isBuzzing ? 'bg-slate-100 text-slate-400 border-2 border-slate-200 border-dashed cursor-not-allowed hover:bg-slate-200' : ''}
          ${isReady ? 'bg-fun-cream border-fun-dark shadow-hard hover:translate-y-0.5 hover:shadow-hard-hover active:scale-95 cursor-pointer' : ''}
        `}
        aria-disabled={!isReady}>
          <span className={`
            font-pop text-4xl uppercase tracking-wider transition-all duration-300
            ${isReady
              ? "text-fun-dark"
              : "text-gray-300 decoration-4 decoration-red-400/50 blur-[0.5px]"
            }
          `}>
            feed me
          </span>

          {!isReady && (
            <div className="
              absolute -top-1 -right-1
              rotate-12 group-hover:rotate-25 group-hover:scale-110
              transition-all duration-200 ease-spring
            ">
              <AlertTriangle className="w-14 h-14 text-fun-dark fill-yellow-400 stroke-[2.5px] drop-shadow-md"
              />
            </div>
          )}
      </button>
    </fetcher.Form>
  );
}
