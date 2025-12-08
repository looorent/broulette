export function SearchLoaderSpinner() {
  return (
    <>
      <div className="absolute w-[140vw] h-[140vw]
        bg-fun-cream/10 rounded-full
        animate-ping opacity-50 pointer-events-none"
        style={{animationDuration: "7s"}}
        aria-hidden="true"></div>

      <div className="relative mb-12">
        <div className="relative block w-[100px] h-[100px] border-[6px] border-fun-dark bg-fun-yellow shadow-hard animate-shape-shift">
          <div className="absolute top-1/2 left-1/2 -mt-2 -ml-2 w-4 h-4 rounded-full border-[3px] border-fun-dark bg-fun-cream animate-spin-orbit"></div>
        </div>
      </div>
    </>
  );
}
