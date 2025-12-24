import { ArrowLeft } from "lucide-react";

// TODO implement this properly (and restyle it)
export function ErrorUnknown() {
  return (
    <main
      id="unexpected-error-page"
      className="
        flex flex-col
        items-center justify-center
        p-6
        relative
        h-full w-full
        overflow-hidden
      ">

      <div className="flex items-center justify-center gap-2 font-pop text-8xl md:text-9xl leading-none text-fun-yellow drop-shadow-[5px_5px_0px_rgba(45,52,54,1)] tracking-tighter">
        <span className="transform -rotate-12 inline-block hover:rotate-0 transition-transform duration-300">M</span>
        <span className="transform rotate-6 inline-block hover:rotate-0 transition-transform duration-300 text-fun-cream">e</span>
        <span className="transform -rotate-6 inline-block hover:rotate-0 transition-transform duration-300">h</span>
      </div>

      <div className="inline-block  my-5
        bg-fun-dark text-fun-cream px-6 py-2 rounded-full transform rotate-2 mt-6 shadow-hard-white border-2 border-transparent">
        <p className="font-display font-bold tracking-widest uppercase text-sm md:text-base">
          An unexpected error occurred.
        </p>
      </div>

      <a
        href="/"
        aria-label="Back to Lobby"
        className={`
        flex items-center gap-2 justify-center
        px-2 py-2

        bg-fun-cream/95 backdrop-blur-md
        border-[3px] border-fun-dark rounded-md shadow-hard-hover
        text-fun-dark font-bold font-pop uppercase text-sm tracking-wide

        animate-slide-in-from-top-right

        cursor-pointer transition-transform duration-500
        hover:rotate-0 hover:brightness-115 active:scale-120
      `}
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Lobby</span>
      </a>

    </main>
  );
}
