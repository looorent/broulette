import { useDrag } from "@use-gesture/react";
import { BadgeQuestionMark, Car, Footprints, Hamburger, MapPin, Rocket, ShoppingBag, Star, type LucideIcon } from "lucide-react";
import { forwardRef, useImperativeHandle, useState } from "react";

import { findIconFor, type DistanceRangeOption, type Preference } from "@features/search";

import { PreferenceChipValue } from "./preference-chip-value";

interface PreferenceChipProps {
  onOpen?: () => void;
  preferences: Preference;
}

export interface PreferenceChipHandle {
  handleBuzzOnLocationError?: () => void;
}

const DRAG_THRESHOLD_IN_PIXELS = 20;

export const PreferenceChip = forwardRef<PreferenceChipHandle, PreferenceChipProps>(
  ({ onOpen, preferences }, ref) => {
    const [isBuzzing, setIsBuzzing] = useState(false);
    const swipeUp = useDrag(({ down, movement: [, my], velocity: [, _vy], direction: [, _dy] }) => {
        if (!down && my < -DRAG_THRESHOLD_IN_PIXELS) {
          onOpen?.();
        }
      },
      {
        axis: "y",
        filterTaps: true,
        threshold: DRAG_THRESHOLD_IN_PIXELS
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
    const distanceIcon = findDistanceIcon(preferences?.range);

    return (
      <section className="w-full px-2 pb-0">
        <button className={`
          group relative z-40 -mb-4 flex w-full animate-float cursor-pointer
          touch-none flex-col items-center justify-center gap-2 rounded-t-[3rem]
          border-4 border-b-0 border-fun-dark bg-fun-green p-4 pb-11
          shadow-sheet transition-transform
          hover:-mb-5 hover:-translate-y-3
          active:translate-y-0
        `}
          onClick={onOpen}
          {...swipeUp()}>
          <div className={`
            mb-0.5 h-1.5 w-16 rounded-full bg-fun-dark/20 transition-colors
            group-hover:bg-fun-dark/40
          `}></div>
          <div className="flex items-center gap-2 font-pop text-lg">

            <PreferenceChipValue
              label={isLocationValid ? preferences?.location?.label?.compact : "Where?!"}
              className={`
                -rotate-3
                hover:scale-105 hover:rotate-0
              `}
              icon={MapPin}
              isBuzzing={isBuzzing}
              isValid={isLocationValid}
              />

            <PreferenceChipValue
              className={`
                mt-1.5 rotate-2 p-1
                hover:rotate-0
              `}
            >
              <div className="flex items-center gap-1.5">
                <DistanceIcon icon={distanceIcon} />
                {!preferences?.avoidFastFood && <Hamburger className="h-5 w-5" />}
                {!preferences?.avoidTakeaway && <ShoppingBag className="h-5 w-5" />}
                {preferences?.onlyHighRated && <Star className="h-5 w-5" />}
              </div>
            </PreferenceChipValue>

            <PreferenceChipValue
              label={preferences?.service?.label?.compact}
              className={`
                -mt-1 -rotate-2
                hover:rotate-0
              `}
              icon={findIconFor(preferences?.service)}
            />
          </div>
        </button>
      </section>
    );
  }
);
PreferenceChip.displayName = "PreferenceChip";

function DistanceIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon className="h-5 w-5" />;
}

function findDistanceIcon(range: DistanceRangeOption | undefined): LucideIcon {
  switch(range?.id) {
    case "Close":
      return Footprints;
    case "MidRange":
      return Car;
    case "Far":
      return Rocket;
    default:
      return BadgeQuestionMark;
  }
}
