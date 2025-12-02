import { useDrag } from "@use-gesture/react";
import { Check, Crosshair, MapPin, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createDistanceRangeLabel, DistanceRange, type LocationPreference } from "types/location";
import type { Preference } from "types/preference";
import { type ServicePreference } from "types/service";

export function PreferencesModal({ isOpen, services, preferences, onClosed, onUpdate }: {
  isOpen: boolean,
  services: ServicePreference[],
  preferences: Preference,
  onClosed: () => void,
  onUpdate: (newPreferences: Preference) => void
}) {
  const [range, setRange] = useState(preferences.range);
  const [location, setLocation] = useState(preferences.location);
  const [selectedService, setService] = useState(preferences.service);

  useEffect(() => {
    if (range !== preferences.range) {
      setRange(preferences.range);
    }
    if (location !== preferences.location) {
      setLocation(preferences.location);
    }
    if (selectedService !== preferences.service) {
      setService(preferences.service);
    }
  }, [preferences, range, location, selectedService]);

  const updateLocation = (newLocation: string) => {
    const location = {
      label: "TODO",
      address: newLocation,
      nearby: false
    };
    setLocation(location);
    onUpdate(preferences.withLocation(location));
  };

  const updateRange = (newRange: DistanceRange) => {
    setRange(newRange);
    onUpdate(preferences.withRange(newRange));
  };

  const updateService = (newServiceId: string) => {
    const selected = services.find(service => service.id === newServiceId) || services[0];
    setService(selected);
    onUpdate(preferences.withService(selected));
  };

  const closeModal = () => {
    if (onClosed) {
      if (isOpen) {
        onClosed();
      }
    }
  };

  const swipeDown = useDrag(({ down, movement: [, my], velocity: [, vy], direction: [, dy], memo }) => {
    if (down) {
      closeModal();
    }
  },
    {
      axis: "y",
      filterTaps: true,
      threshold: 50
    }
  );

  const timeScrollRef = useRef<HTMLDivElement>(null);
  const bindTimeslotScroll = useDrag(({ active, movement: [mx], direction: [dx], cancel, event, memo = timeScrollRef.current?.scrollLeft }) => {
    event.stopPropagation();
    if (timeScrollRef.current) {
      timeScrollRef.current.scrollLeft = memo - mx;
    }
    return memo;
  }, {
    axis: "x",
    filterTaps: true,
    from: () => [timeScrollRef.current?.scrollLeft || 0, 0],
    eventOptions: { passive: false },
    pointer: { touch: false },
  });

  return (
    <dialog id="settings-modal"
      className={`flex flex-col fixed inset-0 z-100 items-center justify-end
        py-0 px-2 backdrop-blur-sm w-full h-dvh border-none m-0 max-w-full max-h-full bg-transparent
        transform transition-transform duration-300
        ${isOpen ? "ease-out" : "ease-in"}
        ${isOpen ? "translate-y-0" : "translate-y-full"}
      `}
      open>

      <div className="bg-fun-cream w-full sm:max-w-md border-x-2 border-t-4 border-fun-dark rounded-t-3xl sm:rounded-3xl p-6 pb-10
                        shadow-hard relative mx-auto max-h-[90vh] touch-pan-y">

        <div id="settings-modal-header"
          {...swipeDown()}
          className="w-full pt-0 pb-6 -mt-6 cursor-grab active:cursor-grabbing touch-none"
        >
            <div className="w-20 h-2 bg-fun-dark/80 rounded-full mx-auto mt-6"></div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h3 className="font-pop text-3xl text-fun-dark">Preferences</h3>
          <button onClick={() => closeModal()} className="text-fun-dark hover:scale-110 transition-transform" aria-label="Close Settings">
            <XCircle className="w-8 h-8 stroke-[2.5px]" />
          </button>
        </div>

        <form id="preferences-form" className="flex flex-col gap-8" onSubmit={() => false}>
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
                  value={location.label}
                  onChange={event => updateLocation(event.target.value) }
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
                  onChange={event => updateRange(Number(event.target.value))}
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
                  {createDistanceRangeLabel(range)}
                </span>
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-3 relative border-none p-0 m-0 min-w-0">
            <legend className="block font-pop text-2xl text-fun-dark tracking-wide mb-2">When?</legend>
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-linear-to-l from-fun-cream via-fun-cream/80 to-transparent pointer-events-none z-10 rounded-r-xl" aria-hidden="true"></div>
            <div id="time-scroll-container"
              ref={timeScrollRef}
              {...bindTimeslotScroll()}
              className="
                flex gap-4 p-1
                overflow-x-auto
                [&::-webkit-scrollbar]:hidden
                [-ms-overflow-style:none]
                [scrollbar-width:none]
                cursor-grab active:cursor-grabbing select-none
                touch-pan-y touch-pan-x
                snap-x snap-mandatory
                max-w-full
                pr-24
              " role="radiogroup">

              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <label className="cursor-pointer group relative flex-none w-32" key={service.id}>
                    <input type="radio"
                      name="time"
                      value={service.id}
                      className="peer sr-only"
                      onChange={event => updateService(event.target.value)}
                      checked={service.id === selectedService.id} />
                    <div className="h-full rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all
                      border-4
                      bg-white
                      border-fun-dark/10
                      group-hover:border-fun-dark/30
                      peer-checked:border-fun-dark
                      peer-checked:bg-fun-yellow
                      peer-checked:shadow-hard">
                      <Icon className="w-8 h-8 stroke-[2.5px] text-fun-dark" />
                      <span className="font-sans font-bold text-fun-dark uppercase tracking-tight text-center leading-none">{service.label}</span>
                    </div>
                    <div className="absolute -top-1 -right-1 bg-fun-green border-2 border-fun-dark rounded-full p-1 opacity-0 peer-checked:opacity-100 transition-opacity shadow-hard-hover scale-0 peer-checked:scale-100 duration-200 z-10">
                      <Check className="w-4 h-4 text-fun-cream stroke-[4px]" />
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* <button type="button"
                            className="hidden w-full bg-transparent border-[3px] border-dashed border-fun-dark/50 rounded-2xl p-3 flex items-center justify-center gap-2 font-bold text-fun-dark/70 hover:bg-fun-cream/30 hover:border-fun-dark hover:text-fun-dark transition-all active:scale-95 font-pop tracking-wide text-lg">
                    <ChefHat className="w-6 h-6 stroke-[2.5px]" />
                    Picky Eater?
                    </button> */}

          {/* <button type="submit"
            className="
              w-full mt-auto
              bg-fun-green border-4 border-fun-dark rounded-2xl py-4 shadow-hard flex items-center justify-center gap-3 transition-transform
              active:translate-y-2 active:translate-x-2
            ">
            <span className="font-pop text-2xl text-fun-dark uppercase tracking-wide">Okay</span>
          </button> */}
        </form>
      </div>
    </dialog>
  );
}
