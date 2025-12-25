import { ArrowLeft, OctagonAlert } from "lucide-react";

import { AmbientPulse } from "@components/ambient-pulse";

export function ErrorUnknown() {
  return (
    <main
      id="unexpected-error-page"
      className={`
        relative z-10 flex h-full w-full flex-col items-center justify-center
        gap-6 p-6
      `}
    >
      <AmbientPulse />

      {/* Floating Icon Decoration */}
      <div className="z-10 mb-6 animate-float">
        <div className={`
          rotate-12 rounded-full border-[3px] border-fun-dark bg-fun-cream p-3
          text-fun-dark shadow-hard
        `}>
          <OctagonAlert className="h-10 w-10" />
        </div>
      </div>

      {/* Title Text */}
      <div className={`
        z-10 flex cursor-default flex-col items-center justify-center gap-1
        font-pop text-6xl leading-none tracking-tighter text-fun-yellow
        drop-shadow-[5px_5px_0px_rgba(45,52,54,1)]
      `}>
        <span className={`
          inline-block -rotate-4 transform transition-transform duration-300
          hover:scale-110 hover:rotate-0
        `}>
          Something
        </span>
        <span className={`
          inline-block rotate-8 transform text-fun-cream transition-transform
          duration-300
          hover:scale-110 hover:rotate-0
        `}>
          went
        </span>
        <span className={`
          inline-block -rotate-1 transform transition-transform duration-300
          hover:scale-110 hover:rotate-0
        `}>
          weird
        </span>
      </div>

      <a
        href="/"
        aria-label="Back to Lobby"
        className={`
          mt-8 flex animate-slide-in-from-top-right cursor-pointer items-center
          justify-center gap-2 rounded-md border-[3px] border-fun-dark
          bg-fun-cream/95 p-4 font-pop text-xl font-bold tracking-wide
          text-fun-dark shadow-hard-hover backdrop-blur-md
          hover:rotate-0 hover:brightness-115
          active:scale-120
        `}
      >
        <ArrowLeft className="h-8 w-8 stroke-[3px]" />
        <span>Lobby</span>
      </a>
    </main>
  );
}
