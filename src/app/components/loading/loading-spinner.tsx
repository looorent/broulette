export default function LoadingSpinner() {
  return (
    <div>
      <div className="absolute w-[140vw] h-[140vw]
        bg-fun-cream/10 rounded-full
        animate-ping opacity-20 pointer-events-none"
        style={{animationDuration: "3s"}}
        aria-hidden="true"></div>

      <div className="relative mb-12">
        <div className="loader-shape">
          <div className="orbit-dot animate-spin-orbit"></div>
        </div>
      </div>
    </div>
  );
}
