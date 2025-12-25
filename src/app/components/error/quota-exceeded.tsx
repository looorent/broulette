import { ArrowLeft, PiggyBank, CalendarClock } from "lucide-react";

// TODO use this!
export function QuotaExceeded() {
  return (
    <div
      className={`
        relative flex h-full w-full flex-col overflow-hidden bg-fun-red
        bg-[radial-gradient(circle_at_20%_80%,rgba(255,209,102,0.6)_0%,transparent_40%),radial-gradient(circle_at_80%_20%,rgba(6,214,160,0.5)_0%,transparent_40%),conic-gradient(from_45deg_at_50%_50%,rgba(232,90,79,0.2)_0deg,rgba(255,209,102,0.2)_120deg,rgba(232,90,79,0.2)_240deg),linear-gradient(135deg,#D64035_0%,#A33028_100%)]
        background-blend
        md:h-[85vh] md:max-w-120 md:rounded-3xl md:shadow-2xl
      `}
    >
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

        {/* Floating Icon: Piggy Bank to symbolize the "Free Project" budget */}
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

        {/* Big Impact Text "MAXED" */}
        <div className={`
          z-10 mb-2 flex cursor-default items-center justify-center gap-1
          font-pop text-7xl leading-none tracking-tighter text-fun-yellow
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

        {/* Explanation Pill */}
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

        {/* Action Buttons */}
        <div className="z-20 flex w-full max-w-xs flex-col gap-3">

          {/* Primary Action: Read-only / Waiting State */}
          <div className={`
            group relative flex w-full cursor-not-allowed items-center
            justify-center gap-3 rounded-xl border-4 border-dashed
            border-fun-dark/50 bg-fun-cream px-6 py-4 font-display text-sm
            font-bold tracking-wider text-fun-dark/50 uppercase
          `}>
            <CalendarClock className="h-5 w-5" />
            <span>Resets on the 1st</span>
          </div>

          {/* Secondary Action: Home */}
          <a
            href="/"
            className={`
              flex w-full items-center justify-center gap-2 px-4 py-3 font-pop
              text-sm font-bold tracking-wide text-white/80 uppercase
              decoration-2 underline-offset-4 transition-colors
              hover:text-white hover:underline
            `}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Lobby</span>
          </a>
        </div>
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
    </div>
  );
}
