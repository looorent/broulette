import { SearchX } from "lucide-react";

import { BackButton } from "./back-button";

interface NoResultsProps {
  momentLabel: string;
}

export function NoResults({ momentLabel }: NoResultsProps) {
  return (
    <>
      <main
        className={`
          relative z-10 flex h-full w-full flex-col items-center justify-center
          p-6
        `}
      >
        {/* Background Atmosphere */}
        <div
          className={`
            pointer-events-none absolute z-0 h-96 w-96 animate-pulse-mega
            rounded-full bg-fun-cream/10
          `}
          aria-hidden="true"
        />

        {/* Floating Icon */}
        <div className="relative z-10 mb-8 animate-float">
          {/* Decorative elements behind the icon */}
          <div className={`
            absolute top-0 right-0 -mt-2 -mr-2 h-4 w-4 rounded-full border-2
            border-fun-dark bg-fun-green
          `}></div>
          <div className={`
            absolute bottom-0 left-0 -mb-1 -ml-3 h-3 w-3 rounded-full border-2
            border-fun-dark bg-fun-yellow
          `}></div>

          <div className={`
            -rotate-6 rounded-2xl border-[3px] border-fun-dark bg-fun-cream p-4
            text-fun-dark shadow-hard
          `}>
            <SearchX className="h-12 w-12" />
          </div>
        </div>

        {/* Big Impact Text "NOPE" */}
        <div className={`
          z-10 mb-2 flex cursor-default items-center justify-center gap-1
          font-pop text-8xl leading-none tracking-tighter text-fun-yellow
          drop-shadow-[5px_5px_0px_rgba(45,52,54,1)]
          md:text-9xl
        `}>
          <span className={`
            inline-block -rotate-6 transform transition-transform duration-300
            hover:scale-110 hover:rotate-0
          `}>
            N
          </span>
          <span className={`
            inline-block rotate-3 transform text-fun-cream transition-transform
            duration-300
            hover:scale-110 hover:rotate-0
          `}>
            O
          </span>
          <span className={`
            inline-block -rotate-3 transform transition-transform duration-300
            hover:scale-110 hover:rotate-0
          `}>
            P
          </span>
          <span className={`
            inline-block rotate-6 transform text-fun-cream transition-transform
            duration-300
            hover:scale-110 hover:rotate-0
          `}>
            E
          </span>
        </div>

        {/* Explanation Pill */}
        <div
          className={`
            z-10 my-6 inline-block max-w-[80%] -rotate-1 transform rounded-xl
            border-2 border-transparent bg-fun-dark px-6 py-3 text-center
            text-fun-cream shadow-hard-white transition-all duration-300
            hover:rotate-0
          `}
        >
          <p className={`
            font-display text-xs leading-relaxed font-bold uppercase
            md:text-sm
          `}>
            We looked everywhere, but zero matching spots are open for that slot: {momentLabel}
          </p>
        </div>

        <BackButton />
      </main>

      {/* Decorative Footer */}
      <footer className={`
        pointer-events-none absolute bottom-0 w-full px-2 pb-0 opacity-30
        grayscale select-none
      `}>
        <div className={`
          flex h-8 w-full flex-col items-center justify-center rounded-t-[3rem]
          border-4 border-b-0 border-fun-dark/20 bg-fun-dark/10 p-4
        `}></div>
      </footer>
    </>
  );
}
