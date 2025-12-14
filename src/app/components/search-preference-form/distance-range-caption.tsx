import type { DistanceRangeOption } from "@features/search";

interface DistanceRangeCaptionProps {
  ranges: DistanceRangeOption[];
  className?: string;
}

export function DistanceRangeCaption({ ranges, className = "" }: DistanceRangeCaptionProps) {
  return (
    <div
      className={`
        flex justify-between
        font-bold text-xs text-fun-dark/60 font-sans uppercase
        tracking-widest
        ${className}
      `}
      aria-hidden="true"
    >
      <span>{ranges[0].label.compact}</span>
      <span>{ranges[ranges.length - 1].label.compact}</span>
    </div>
  );
}
