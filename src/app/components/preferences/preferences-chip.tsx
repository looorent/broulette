import { useDrag } from "@use-gesture/react";
import { Footprints, MapPin } from "lucide-react";
import { forwardRef, useImperativeHandle, useState } from "react";
import type { Preference } from "~/types/preference";

interface PreferenceChipProps {
  onOpen?: () => void;
  preferences: Preference;
}

export interface PreferenceChipHandle {
  handleBuzzOnLocationError?: () => void;
}

const DRAG_TRESHOLD_IN_PIXELS = 20;

export const PreferenceChip = forwardRef<PreferenceChipHandle, PreferenceChipProps>(
  ({ onOpen, preferences }, ref) => {
    const [isBuzzing, setIsBuzzing] = useState(false);
    const swipeUp = useDrag(({ down, movement: [, my], velocity: [, vy], direction: [, dy], memo }) => {
        if (!down && my < -DRAG_TRESHOLD_IN_PIXELS) {
          onOpen?.();
        }
      },
      {
        axis: "y",
        filterTaps: true,
        threshold: DRAG_TRESHOLD_IN_PIXELS
      });

    const triggerLocationBuzz = () => {
      if (!isBuzzing) {
        setIsBuzzing(true);
        setTimeout(() => setIsBuzzing(false), 600);
      }
    };

    useImperativeHandle(ref, () => ({
      handleBuzzOnLocationError: () => {
        triggerLocationBuzz();
      },
    }));

    const isLocationValid: boolean = preferences?.hasValidLocation();

    let ServiceIcon = preferences?.service?.icon;

    return (
      <section className="w-full px-2 pb-0">
        <button className="w-full bg-fun-green
        border-4 border-b-0 border-fun-dark rounded-t-[3rem]
        p-4 pb-6 shadow-sheet flex flex-col
        -mb-4
        items-center justify-center gap-2
        transition-transform hover:-translate-y-3 active:translate-y-0 hover:-mb-5  cursor-pointer group relative z-40 animate-float
        touch-none"
          onClick={onOpen}
          {...swipeUp()}>
          <div className="w-16 h-1.5 bg-fun-dark/20 rounded-full mb-0.5 transition-colors group-hover:bg-fun-dark/40"></div>
          <div className="flex items-center gap-2 font-pop text-lg">

            {/* Location */}
            <div className="relative group/tag">
              <div className={`
                flex items-center gap-1.5 px-3 py-1
                border-2
                shadow-none
                rounded-md
                bg-fun-cream
                -rotate-3 hover:rotate-0 hover:scale-105
                transition-all duration-200 ease-spring
                ${!isLocationValid ? "bg-fun-cream text-fun-red hover:translate-y-0.5 hover:shadow-hard-hover active:scale-95 border-dashed  hover:bg-slate-200" : ""}
                ${isBuzzing ? 'animate-buzz ' : ''}
              `}>
                <MapPin className="w-4 h-4 fill-fun-cream" />
                <span className="font-bold text-sm uppercase tracking-wide whitespace-nowrap truncate max-w-32">
                  {isLocationValid ? preferences?.location?.label?.compact : "Where?!"}
                </span>

                {!isLocationValid ? (
                  <span className={`
                  absolute -top-1 -right-1
                  w-3 h-3
                  bg-fun-red rounded-full border-2 border-fun-cream
                  ${isBuzzing ? 'animate-buzz ' : ''}
                `} />
                ) : null}
              </div>
            </div>

            {/* Distance range */}
            <div className="relative group/tag">
              <div className="
                flex items-center gap-1.5 px-3 py-1
                border-2
                shadow-none
                rounded-md
                bg-fun-cream
                rotate-2 hover:rotate-0 mt-1.5
                transition-all duration-200 ease-spring
              ">
                <Footprints className="w-4 h-4 fill-fun-cream" />
                <span className="font-bold text-sm uppercase tracking-wide whitespace-nowrap truncate max-w-32">
                  {preferences?.range?.label?.compact}
                </span>
              </div>
            </div>

            {/* When? */}
            <div className="relative group/tag">
              <div className="
                flex items-center gap-1.5 px-3 py-1
                border-2
                shadow-none
                rounded-md
                bg-fun-cream
                -rotate-2 hover:rotate-0 -mt-1
                transition-all duration-200 ease-spring
              ">
                {/* TODO some icons are not rendered properly */}
                {/* TODO add a padding in the chip */}
                <ServiceIcon className="w-4 h-4 fill-fun-cream" />
                <span className="font-bold text-sm uppercase tracking-wide whitespace-nowrap truncate max-w-32">
                  {preferences?.service?.label?.compact}
                </span>
              </div>
            </div>
          </div>
        </button>
      </section>
    );
  }
);

PreferenceChip.displayName = "PreferenceChip";
