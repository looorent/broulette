interface DistanceRangeTagProps {
  text?: string;
  className?: string;
}

export function DistanceRangeTag({ text, className = "" }: DistanceRangeTagProps) {
  return (
    <div className={`relative w-[90px] h-10 shrink-0 mt-1 ${className}`}>
      <svg
        className="w-full h-full overflow-visible"
        viewBox="0 0 100 45"
        aria-hidden="true"
      >
        <path
          className="fill-fun-yellow stroke-3 stroke-fun-dark drop-shadow-[2px_2px_0px_var(--color-fun-dark)]"
          d="M15 0 H90 A10 10 0 0 1 100 10 V35 A10 10 0 0 1 90 45 H15 A10 10 0 0 1 5 35 L0 22.5 L5 10 A10 10 0 0 1 15 0 Z"
        />
      </svg>

      <span className="
        absolute inset-0
        flex items-center justify-center
        font-sans font-bold text-xs text-fun-dark
        whitespace-nowrap
        select-none">
        {text}
      </span>
    </div>
  );
}
