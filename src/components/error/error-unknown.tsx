import { OctagonAlert } from "lucide-react";

import { AmbientPulse } from "@components/ambient-pulse";

import { BackButton } from "./back-button";

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

      <BackButton />
    </main>
  );
}
