import type { Preference } from "@features/search";
import { useDrag } from "@use-gesture/react";
import { Footprints, MapPin } from "lucide-react";
import { forwardRef, useImperativeHandle, useState } from "react";
import { PreferenceChipValue } from "./preference-chip-value";

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

    const isLocationValid = preferences ? !preferences.isDeviceLocationAttempted || preferences.hasValidLocation : true;
    return (
      <section className="w-full px-2 pb-0">
        <button className="
            w-full bg-fun-green
            border-4 border-b-0 border-fun-dark rounded-t-[3rem]
            p-4 pb-11 shadow-sheet flex flex-col
            -mb-4
            items-center justify-center gap-2
            transition-transform hover:-translate-y-3 active:translate-y-0 hover:-mb-5  cursor-pointer group relative z-40 animate-float
            touch-none
          "
          onClick={onOpen}
          {...swipeUp()}>
          <div className="w-16 h-1.5 bg-fun-dark/20 rounded-full mb-0.5 transition-colors group-hover:bg-fun-dark/40"></div>
          <div className="flex items-center gap-2 font-pop text-lg">

            <PreferenceChipValue
              label={isLocationValid ? preferences?.location?.label?.compact : "Where?!"}
              className="-rotate-3 hover:rotate-0 hover:scale-105"
              icon={MapPin}
              isBuzzing={isBuzzing}
              isValid={isLocationValid}
              />

            <PreferenceChipValue
              label={preferences?.range?.label?.compact}
              className="rotate-2 hover:rotate-0 mt-1.5"
              icon={Footprints}
              />

            <PreferenceChipValue
              label={preferences?.service?.label?.compact}
              className="-rotate-2 hover:rotate-0 -mt-1"
              icon={preferences?.service?.icon}
              />
          </div>
        </button>
      </section>
    );
  }
);
