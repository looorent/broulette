export function SearchLoaderSpinner() {
  return (
    <>
      <div className={`
        pointer-events-none absolute h-[140vw] w-[140vw] animate-ping
        rounded-full bg-fun-cream/10 opacity-60
      `}
        style={{animationDuration: "2s"}}
        aria-hidden="true"></div>

      <div className="relative mb-12">
        <div className={`
          relative block h-[100px] w-[100px] animate-shape-shift border-[6px]
          border-fun-dark bg-fun-yellow shadow-hard
        `}>
          <div className={`
            absolute top-1/2 left-1/2 -mt-2 -ml-2 h-4 w-4 animate-spin-orbit
            rounded-full border-[3px] border-fun-dark bg-fun-cream
          `}></div>
        </div>
      </div>
    </>
  );
}
