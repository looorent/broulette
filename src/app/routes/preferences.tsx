
import { CalendarPlus, Check, ChefHat, Clock, Crosshair, Dices, MapPin, Moon, Sun, UtensilsCrossed, type LucideProps } from "lucide-react";
import { useState } from "react";
import type { Route } from "../+types/root";
import { useFetcher } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "BiteRoulette - New search" },
    { name: "description", content: "Help us help you - Search form" },
  ];
}

function createRangeLabel(range: number): string {
  switch (range) {
    default:
    case 1:
      return "Walkable";
    case 2:
      return "Drive";
    case 3:
      return "Adventure";
  }
}

type MomentValue = "right_now" | "tonight" | "tomorrow_lunch" | "tomorrow_dinner" | "pick_a_moment";
interface MomentOption {
  value: MomentValue;
  icon: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
  label: string;
}
const MOMENT_OPTIONS: MomentOption[] = [
  {
    value: "right_now",
    icon: Clock,
    label: "Right Now"
  },
  {
    value: "tonight",
    icon: Moon,
    label: "Tonight"
  },
  {
    value: "tomorrow_lunch",
    icon: Sun,
    label: "Tomorrow Lunch"
  },
  {
    value: "tomorrow_dinner",
    icon: UtensilsCrossed,
    label: "Tomorrow Dinner"
  },
  {
    value: "pick_a_moment",
    icon: CalendarPlus,
    label: "Pick a moment"
  },
];

export default function NewSearchForm() {
  const [range, setRange] = useState(1);
  const [selectedMoment, setMoment] = useState(("right_now" as MomentValue));
  const [location, setLocation] = useState("");


  const fetcher = useFetcher();

  return (
    <section className="flex flex-col h-full" aria-label="Preferences">
      <form className="flex flex-col gap-8 m-8 h-full">

        <fieldset className="space-y-2 relative border-none p-0 m-0">
          <legend className="block font-pop text-2xl text-fun-dark tracking-wide mb-2">
            Near where?
          </legend>

          <div className="relative group">
            <div className="absolute -inset-1 bg-fun-dark rounded-2xl blur opacity-20 group-hover:opacity-40 transition"></div>
            <div className="relative bg-fun-cream border-4 border-fun-dark rounded-2xl shadow-hard flex items-center p-2 focus-within:translate-y-0.5 focus-within:shadow-hard-hover transition-all">
              <div className="ml-2 mr-3">
                <MapPin className="w-6 h-6 text-fun-dark stroke-3" />
              </div>

              <input type="text" 
                     id="location-input"
                     placeholder="City, neighborhood..."
                     className="flex-1 min-w-0 bg-transparent font-sans font-medium text-lg text-fun-dark placeholder:text-fun-dark/40 outline-none"
                     value={location}
                     onChange={event => setLocation(event.target.value)}
                     autoComplete="off"
                     aria-autocomplete="list" />

              <button type="button" 
                      aria-label="Use my current location"
                    className="ml-2 bg-fun-yellow text-fun-dark border-2 border-fun-dark px-3 py-1 rounded-xl font-bold uppercase tracking-wider hover:bg-white transition-colors flex items-center shadow-hard-hover active:scale-95">
                <Crosshair className="w-4 h-4 text-fun-dark stroke-3" />
              </button>
            </div>
          </div>

          <div className="flex gap-3 px-1">
            <div className="flex-1 relative pt-1">
              <input type="range" 
                     min="1"
                     max="3"
                     value={range}
                     onChange={event => setRange(Number(event.target.value))}
                     name="rangeInput"
                     className="
                       /* Base Input Styles (Original CSS: input[type=range]) */
                       appearance-none w-full h-10 bg-transparent relative z-10 cursor-pointer m-0 
                       focus:outline-none

                       /* Webkit (Chrome, Safari, Edge) Track Styles */
                       [&::-webkit-slider-runnable-track]:w-full 
                       [&::-webkit-slider-runnable-track]:h-2 
                       [&::-webkit-slider-runnable-track]:cursor-pointer 
                       [&::-webkit-slider-runnable-track]:bg-fun-cream
                       [&::-webkit-slider-runnable-track]:border-2 
                       [&::-webkit-slider-runnable-track]:border-border-dark 
                       [&::-webkit-slider-runnable-track]:rounded-full

                       /* Webkit (Chrome, Safari, Edge) Thumb Styles */
                       [&::-webkit-slider-thumb]:appearance-none 
                       [&::-webkit-slider-thumb]:h-8 
                       [&::-webkit-slider-thumb]:w-8
                       [&::-webkit-slider-thumb]:rounded-full 
                       [&::-webkit-slider-thumb]:bg-fun-yellow
                       [&::-webkit-slider-thumb]:border-4 
                       [&::-webkit-slider-thumb]:border-border-dark
                       [&::-webkit-slider-thumb]:cursor-pointer 
                       [&::-webkit-slider-thumb]:-mt-3
                       [&::-webkit-slider-thumb]:shadow-custom-thumb
                       [&::-webkit-slider-thumb]:transition-transform
                       [&::-webkit-slider-thumb:hover]:scale-110

                       /* Moz (Firefox) Track Styles (Added for compatibility) */
                       [&::-moz-range-track]:w-full 
                       [&::-moz-range-track]:h-2 
                       [&::-moz-range-track]:cursor-pointer 
                       [&::-moz-range-track]:bg-fun-cream
                       [&::-moz-range-track]:border-2 
                       [&::-moz-range-track]:border-fun-dark 
                       [&::-moz-range-track]:rounded-full

                       /* Moz (Firefox) Thumb Styles (Added for compatibility) */
                       [&::-moz-range-thumb]:h-8 
                       [&::-moz-range-thumb]:w-8
                       [&::-moz-range-thumb]:rounded-full 
                       [&::-moz-range-thumb]:bg-fun-yellow
                       [&::-moz-range-thumb]:border-4 
                       [&::-moz-range-thumb]:border-border-dark
                       [&::-moz-range-thumb]:cursor-pointer
                       [&::-moz-range-thumb]:shadow-hard-hover
                       [&::-moz-range-thumb]:transition-transform
                       [&::-moz-range-thumb:hover]:scale-110
                   "
                     aria-label="Distance preference" />
              <div className="flex justify-between font-bold text-xs text-fun-dark/60 font-sans uppercase tracking-widest"
                  aria-hidden="true">
                <span>Close</span>
                <span>Far</span>
              </div>
            </div>

            {/* TODO Lorent make components */}

            <div className="relative w-[90px] h-10 shrink-0 mt-1" aria-hidden="true">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 100 45">
                <path className="fill-fun-yellow stroke-3 stroke-fun-dark drop-shadow-[2px_2px_0px_var(--color-fun-dark)]" 
                      d="M15 0 H90 A10 10 0 0 1 100 10 V35 A10 10 0 0 1 90 45 H15 A10 10 0 0 1 5 35 L0 22.5 L5 10 A10 10 0 0 1 15 0 Z" />
              </svg>

              <span className="absolute inset-0 flex items-center justify-center font-sans font-bold text-xs text-fun-dark whitespace-nowrap">
                {createRangeLabel(range)}
              </span>
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-3 relative border-none p-0 m-0">
          <legend className="block font-pop text-2xl text-fun-dark tracking-wide mb-2">When?</legend>
          <div className="absolute right-0 top-10 bottom-0 w-16 bg-linear-to-l from-fun-red/40 to-transparent pointer-events-none z-10 rounded-r-xl" aria-hidden="true"></div>
            <div id="time-scroll-container"
                 className="flex gap-4 overflow-x-auto p-1 no-scrollbar cursor-grab active:cursor-grabbing select-none relative touch-pan-x" role="radiogroup">
              
              {MOMENT_OPTIONS.map((moment) => {
                const Icon = moment.icon;
                return (  
                  <label className="cursor-pointer group relative flex-none w-32" key={moment.value}>
                    <input type="radio" 
                           name="time" 
                           value={moment.value} 
                           className="peer sr-only" 
                           onChange={event => setMoment(event.target.value as MomentValue)}
                           checked={selectedMoment === moment.value} />
                    <div className="h-full bg-fun-cream border-4 border-transparent peer-checked:border-fun-dark peer-checked:bg-fun-yellow peer-checked:shadow-hard rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all hover:bg-white/90"> 
                        <Icon className="w-8 h-8 stroke-[2.5px] text-fun-dark" />
                        <span className="font-sans font-bold text-fun-dark uppercase tracking-tight text-center leading-none">{moment.label}</span>
                    </div>
                    <div className="absolute -top-1 -right-1 bg-fun-green border-2 border-fun-dark rounded-full p-1 opacity-0 peer-checked:opacity-100 transition-opacity shadow-hard-hover scale-0 peer-checked:scale-100 duration-200 z-10">
                        <Check className="w-4 h-4 text-fun-cream stroke-[4px]" />
                        <i data-lucide="check" className="w-4 h-4 text-fun-cream stroke-[4px]"></i>
                    </div>
                  </label>
                );
              })}
            </div>
        </fieldset>

        <button type="button"
                className="hidden w-full bg-transparent border-[3px] border-dashed border-fun-dark/50 rounded-2xl p-3 flex items-center justify-center gap-2 font-bold text-fun-dark/70 hover:bg-fun-cream/30 hover:border-fun-dark hover:text-fun-dark transition-all active:scale-95 font-pop tracking-wide text-lg">
          <ChefHat className="w-6 h-6 stroke-[2.5px]" />
          Picky Eater?
        </button>

        <button type="submit" 
                className="
                  w-full mt-auto
                  bg-fun-green border-4 border-fun-dark rounded-2xl py-4 shadow-hard flex items-center justify-center gap-3 transition-transform
                  active:translate-y-2 active:translate-x-2">
          <span className="font-pop text-2xl text-fun-dark uppercase tracking-wide">Roll the Dice</span>
          <Dices className="w-8 h-8 stroke-[3px] text-fun-dark" />
        </button>
      </form> 
    </section>
  );
}