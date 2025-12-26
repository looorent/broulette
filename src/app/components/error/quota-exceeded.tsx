import { PiggyBank } from "lucide-react";

import { AmbientPulse } from "@components/ambient-pulse";

import { BackButton } from "./back-button";

// TODO use this!
export function QuotaExceeded() {
  return (
    <main
      className={`
        relative z-10 flex h-full w-full flex-col items-center justify-center
        p-6
      `}
    >
      <AmbientPulse />

      <div className="relative z-10 mb-8 animate-float">
        <div className={`
          absolute top-0 left-0 -mt-2 -ml-2 h-4 w-4 rounded-full border-2
          border-fun-dark bg-fun-blue
        `}></div>
        <div className={`
          rotate-3 rounded-2xl border-[3px] border-fun-dark bg-fun-cream p-4
          text-fun-dark shadow-hard
        `}>
          <PiggyBank className="h-12 w-12" />
        </div>
      </div>

      <div className={`
        z-10 mb-2 flex cursor-default items-center justify-center gap-1 font-pop
        text-7xl leading-none tracking-tighter text-fun-yellow
        drop-shadow-[5px_5px_0px_rgba(45,52,54,1)]
        md:text-8xl
      `}>
        <span className={`
          inline-block -rotate-6 transform transition-transform duration-300
          hover:scale-110 hover:rotate-0
        `}>
          M
        </span>
        <span className={`
          inline-block rotate-3 transform text-fun-cream transition-transform
          duration-300
          hover:scale-110 hover:rotate-0
        `}>
          A
        </span>
        <span className={`
          inline-block -rotate-3 transform transition-transform duration-300
          hover:scale-110 hover:rotate-0
        `}>
          X
        </span>
        <span className={`
          inline-block rotate-6 transform text-fun-cream transition-transform
          duration-300
          hover:scale-110 hover:rotate-0
        `}>
          E
        </span>
        <span className={`
          inline-block -rotate-2 transform transition-transform duration-300
          hover:scale-110 hover:rotate-0
        `}>
          D
        </span>
      </div>

      <div
        className={`
          z-10 my-6 inline-block max-w-[90%] rotate-1 transform rounded-xl
          border-2 border-transparent bg-fun-dark px-6 py-4 text-center
          text-fun-cream shadow-hard-white transition-all duration-300
          hover:rotate-0
        `}
      >
        <p className={`
          mb-2 font-display text-xs leading-relaxed font-bold text-fun-yellow
          uppercase
          md:text-sm
        `}>
          We hit our API limits.
        </p>
        <p className={`
          font-sans text-xs leading-relaxed opacity-90
          md:text-sm
        `}>
          This is a free project running on limited Google/TripAdvisor quotas.
          The wallet is empty until the reset next month.
        </p>
      </div>

      <BackButton />
    </main>
  );
}
