
import type { DistanceRangeOption } from "@features/search";

import { DistanceRangeCaption } from "./distance-range-caption";
import { DistanceRangeTag } from "./distance-range-tag";

interface DistanceRangeSelectorProps {
  selectedRange: DistanceRangeOption;
  ranges: DistanceRangeOption[];
  onChange: (range: DistanceRangeOption) => void;
  className?: string;
}

export function DistanceRangeSelector({ selectedRange, ranges, onChange, className = "" }: DistanceRangeSelectorProps) {
  const foundIndex = ranges.findIndex((range) => range.id === selectedRange?.id) || 0
  const currentIndex = foundIndex === -1 ? 0 : foundIndex;

  const handleInputChange = (newIndex: number) => {
    const newRange = ranges[newIndex];
    if (newRange && newRange.id !== selectedRange.id) {
      onChange(newRange);
    }
  };

  return (
    <div className={`
      flex gap-3 px-1
      ${className}
    `}>
      <div className="relative flex-1 pt-1">
        <input
          type="range"
          min="0"
          max={ranges.length - 1}
          value={currentIndex}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleInputChange(event.target.valueAsNumber)}
          name="distanceRangeInput"
          className={`
            relative z-10 m-0 h-10 w-full cursor-pointer appearance-none
            bg-transparent
            focus:outline-none
            [&::-moz-range-thumb]:h-8 [&::-moz-range-thumb]:w-8
            [&::-moz-range-thumb]:cursor-pointer
            [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4
            [&::-moz-range-thumb]:border-fun-dark
            [&::-moz-range-thumb]:bg-fun-yellow
            [&::-moz-range-thumb]:shadow-hard-hover
            [&::-moz-range-thumb]:transition-transform
            [&::-moz-range-thumb:hover]:scale-110 [&::-moz-range-track]:h-2
            [&::-moz-range-track]:w-full [&::-moz-range-track]:cursor-pointer
            [&::-moz-range-track]:rounded-full [&::-moz-range-track]:border-2
            [&::-moz-range-track]:border-fun-dark
            [&::-moz-range-track]:bg-fun-cream
            [&::-webkit-slider-runnable-track]:h-2
            [&::-webkit-slider-runnable-track]:w-full
            [&::-webkit-slider-runnable-track]:cursor-pointer
            [&::-webkit-slider-runnable-track]:rounded-full
            [&::-webkit-slider-runnable-track]:border-2
            [&::-webkit-slider-runnable-track]:border-fun-dark
            [&::-webkit-slider-runnable-track]:bg-fun-cream
            [&::-webkit-slider-thumb]:-mt-3 [&::-webkit-slider-thumb]:h-8
            [&::-webkit-slider-thumb]:w-8
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:border-4
            [&::-webkit-slider-thumb]:border-fun-dark
            [&::-webkit-slider-thumb]:bg-fun-yellow
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb:hover]:scale-110
          `}
          aria-label="Distance preference"
        />
        <DistanceRangeCaption ranges={ranges} />
      </div>

      <DistanceRangeTag text={selectedRange?.label?.display} />
    </div>
  );
}
