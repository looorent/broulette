import { AmbientPulse } from "@components/ambient-pulse";
import { ArrowLeft, OctagonAlert } from "lucide-react";

export function ErrorUnknown() {
  return (
    <main
      id="unexpected-error-page"
      className="
        flex flex-col
        items-center justify-center
        p-6
        gap-6
        relative
        h-full w-full
        z-10
      "
    >
      <AmbientPulse />

      {/* Floating Icon Decoration */}
      <div className="mb-6 animate-float z-10">
        <div className="
          bg-fun-cream
          text-fun-dark
          border-[3px] border-fun-dark rounded-full
          p-3
          shadow-hard rotate-12">
          <OctagonAlert className="w-10 h-10" />
        </div>
      </div>

      {/* Title Text */}
      <div className="
        z-10
        flex flex-col items-center justify-center
        gap-1
        font-pop text-6xl
        leading-none text-fun-yellow
        drop-shadow-[5px_5px_0px_rgba(45,52,54,1)]
        tracking-tighter cursor-default">
        <span className="transform -rotate-4 inline-block hover:rotate-0 hover:scale-110 transition-transform duration-300">
          Something
        </span>
        <span className="transform rotate-8 inline-block hover:rotate-0 hover:scale-110 transition-transform duration-300 text-fun-cream">
          went
        </span>
        <span className="transform -rotate-1 inline-block hover:rotate-0 hover:scale-110 transition-transform duration-300">
          weird
        </span>
      </div>

      <a
        href="/"
        aria-label="Back to Lobby"
        className="
          flex items-center gap-2 justify-center
          p-4
          mt-8

          bg-fun-cream/95 backdrop-blur-md
          border-[3px] border-fun-dark rounded-md shadow-hard-hover
          text-fun-dark font-bold font-pop tracking-wide text-xl

          animate-slide-in-from-top-right

          cursor-pointer
          hover:rotate-0 hover:brightness-115 active:scale-120
        "
      >
        <ArrowLeft className="w-8 h-8 stroke-[3px]" />
        <span>Lobby</span>
      </a>
    </main>
  );
}
