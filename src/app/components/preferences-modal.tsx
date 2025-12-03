import { useDrag } from "@use-gesture/react";
import { Check, Crosshair, History, Loader2, MapPin, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getBrowserLocation } from "~/functions/geolocation";
import { RANGES } from "~/types/distance";
import { COMMON_LOCATIONS, createDeviceLocation, type LocationPreference } from "~/types/location";
import { Preference } from "~/types/preference";
import { type ServicePreference } from "~/types/service";

export function PreferencesModal({ isOpen, services, preferences, onClosed, onUpdate }: {
  isOpen: boolean,
  services: ServicePreference[],
  preferences: Preference,
  onClosed: () => void,
  onUpdate: (newPreferences: Preference) => void
}) {
  const [selectedRange, setSelectedRange] = useState(preferences.range);
  const [selectedLocation, setSelectedLocation] = useState(preferences.location);
  const [selectedService, setSelectedService] = useState(preferences.service);

  const [locationSearchText, setLocationSearchText] = useState("");
  const [isLocatingDevice, setIsLocatingDevice] = useState(false);
  const [isSearchLocationMode, setIsSearchLocationMode] = useState(false);
  const [isDeviceLocationAllowed, setIsDeviceLocationAllowed] = useState(false);
  const [isSearchingForSuggestions, setIsSearchingForSuggestions] = useState(false);

  const [suggestions, setSuggestions] = useState<LocationPreference[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const timeScrollRef = useRef<HTMLDivElement>(null);
  const locationWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedRange?.id !== preferences?.range?.id) {
      setSelectedRange(preferences.range);
    }
    if (!selectedLocation?.equals(preferences?.location)) {
      setSelectedLocation(preferences.location);
    }

    if (selectedService?.id !== preferences?.service?.id) {
      setSelectedService(preferences.service);
    }
  }, [
    preferences.range?.id,
    preferences.service?.id,
    preferences.location?.coordinates?.latitude,
    preferences.location?.coordinates?.longitude
  ]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
    } else {
      onUpdate(new Preference(selectedService, selectedLocation, selectedRange));
    }
  }, []);

  // TODO
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (locationWrapperRef.current && !locationWrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchLocation = (text: string) => {
    setLocationSearchText(text);

    if (text.length > 0) {
      const filtered = COMMON_LOCATIONS.filter(location =>
        location.label.display.toLowerCase().includes(text.toLowerCase())
      );
      setSuggestions([
        // TODO add current location
        ...filtered
      ]);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: LocationPreference) => {
    // TODO also add the current location to the suggestions
    setLocationSearchText(suggestion?.label?.display || "");
    setShowSuggestions(false);
    setSelectedLocation(suggestion);
    closeSearchTextMode();
  };

  const triggerDeviceLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      // TODO manage error
      return;
    } else {
      setIsLocatingDevice(true);
      setShowSuggestions(false);
      try {
        const position = await getBrowserLocation();
        const deviceLocation = createDeviceLocation(position.coords);
        setSelectedLocation(deviceLocation);
        closeSearchTextMode();
      } catch (e) {
          console.error(e);
          setIsLocatingDevice(false);
          alert("Unable to retrieve your location."); // TODO manage error
      }
    }
  };

  // TODO use "useMemo" to derive some properties

  const locationInputRef = useRef<HTMLInputElement>(null); // TODO does not work
  const enableSearchTextMode = () => {
    setIsLocatingDevice(false);
    setIsSearchLocationMode(true);
    setLocationSearchText("");
    locationInputRef.current?.focus({ preventScroll: true });
  };

  const closeSearchTextMode = () => {
    setIsLocatingDevice(false);
    setIsSearchLocationMode(false);
    setLocationSearchText("");
  };

  const closeModal = () => {
    if (onClosed && isOpen) {
      onClosed();
    };
  };

  const swipeDown = useDrag(({ down, movement: [, my] }) => {
    if (down) {
      closeModal();
    }
  }, {
    axis: "y",
    filterTaps: true,
    threshold: 50
  });

  const bindTimeslotScroll = useDrag(({ active, movement: [mx], event, memo = timeScrollRef.current?.scrollLeft }) => {
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

  const deviceLocationSupported = Boolean(navigator.geolocation) as boolean;

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
          className="w-full pt-0 pb-6 -mt-6 cursor-grab active:cursor-grabbing touch-none">
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

            <div className="relative group" ref={locationWrapperRef}>
              <div className="absolute -inset-1 bg-fun-dark rounded-2xl blur opacity-20 group-hover:opacity-40 transition"></div>

              <div className={`
                relative border-4 border-fun-dark rounded-2xl shadow-hard flex items-center p-2
                transition-all duration-300
                ${isSearchLocationMode ? "bg-fun-cream focus-within:translate-y-0.5 focus-within:shadow-hard-hover" : (!deviceLocationSupported || selectedLocation?.isDeviceLocation && !selectedLocation.hasCoordinates() ? "bg-fun-red" : "bg-fun-yellow") }
              `}>
                <div className="ml-2 mr-3">
                  {
                    isLocatingDevice || isSearchingForSuggestions
                    ? <Loader2 className="w-6 h-6 stroke-3 transition-colors text-fun-dark animate-spin" />
                    : <MapPin className="w-6 h-6 stroke-3 transition-colors text-fun-dark" />
                  }
                </div>

                {isSearchLocationMode ? (
                  <input type="text"
                    id="location-input"
                    ref={locationInputRef}
                    placeholder="City, neighborhood..."
                    className="flex-1 min-w-0 bg-transparent font-sans font-medium text-lg text-fun-dark placeholder:text-fun-dark/40 outline-none"
                    value={locationSearchText}
                    onChange={event => searchLocation(event.target.value) }
                    onFocus={() => setShowSuggestions(locationSearchText?.length > 0)}
                    autoComplete="off"
                  />
                ) : (
                  <div className="flex-1 min-w-0 font-sans font-bold text-lg animate-in fade-in zoom-in duration-200">
                    { deviceLocationSupported ? (
                      selectedLocation?.isDeviceLocation && !selectedLocation.hasCoordinates()
                      ? "Location not allowed"
                      : selectedLocation?.label?.display || ""
                    ): "Location not supported"}
                  </div>
                )}

                <div className="ml-2">
                  {isSearchLocationMode ? (
                    <button
                      type="button"
                      onClick={triggerDeviceLocation}
                      className="bg-fun-yellow text-fun-dark border-2 border-fun-dark px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider hover:bg-yellow transition-colors flex items-center shadow-hard-hover active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                      aria-label="Clear location and use your current device">
                      <Crosshair className="w-5 h-5 stroke-[2.5px]" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={enableSearchTextMode}
                      disabled={isLocatingDevice}
                      className="bg-fun-cream text-fun-dark border-2 border-fun-dark px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider hover:bg-white transition-colors flex items-center shadow-hard-hover active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                      aria-label="Use my current location">
                      <XCircle className="w-5 h-5 text-fun-dark stroke-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* --- AUTOCOMPLETE DROPDOWN --- */}
              {isSearchLocationMode && showSuggestions && suggestions.length > 0 && (
                <div className="
                  absolute top-full left-0 w-full mt-2 z-50
                  bg-white border-4 border-fun-dark rounded-2xl shadow-hard
                  overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200
                ">
                  <ul className="max-h-60 overflow-y-auto no-scrollbar py-1">
                    {suggestions.map((suggestion, index) => (
                      <li key={index}>
                        <button
                          type="button"
                          onClick={() => selectSuggestion(suggestion)}
                          className="
                            w-full text-left px-4 py-3
                            font-sans font-bold text-fun-dark
                            hover:bg-fun-yellow/20 active:bg-fun-yellow/50
                            flex items-center gap-3 transition-colors
                          "
                        >
                          <History className="w-4 h-4 text-fun-dark/50" />
                          {suggestion.label.display}
                        </button>
                      </li>
                    ))}
                  </ul>
                  {/* Optional 'Powered by' footer if using API */}
                  <div className="bg-fun-cream border-t-2 border-fun-dark/10 px-4 py-1 text-[10px] font-bold text-fun-dark/40 uppercase tracking-widest text-center">
                    Suggestions
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 px-1">
              <div className="flex-1 relative pt-1">
                <input type="range"
                  min="1"
                  max={RANGES.length}
                  value={RANGES.findIndex(range => range.id === selectedRange?.id) + 1}
                  onChange={event => setSelectedRange(RANGES[Number((event.target.value as any) - 1)])}
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
                  <span>{ RANGES[0].label.compact }</span>
                  <span>{ RANGES[RANGES.length - 1].label.compact }</span>
                </div>
              </div>
              <div className="relative w-[90px] h-10 shrink-0 mt-1">
                <svg className="w-full h-full overflow-visible"
                     viewBox="0 0 100 45"><path className="fill-fun-yellow stroke-3 stroke-fun-dark drop-shadow-[2px_2px_0px_var(--color-fun-dark)]" d="M15 0 H90 A10 10 0 0 1 100 10 V35 A10 10 0 0 1 90 45 H15 A10 10 0 0 1 5 35 L0 22.5 L5 10 A10 10 0 0 1 15 0 Z" /></svg>
                <span className="absolute inset-0 flex items-center justify-center font-sans font-bold text-xs text-fun-dark whitespace-nowrap">
                  {selectedRange?.label?.display}
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
                      onChange={event => setSelectedService(services.find(service => service.id === event.target.value) || services[0])}
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
                        <span className="font-sans font-bold text-fun-dark uppercase tracking-tight text-center leading-none">{service.label?.display}</span>
                      </div>
                      <div className="absolute -top-1 -right-1 bg-fun-green border-2 border-fun-dark rounded-full p-1 opacity-0 peer-checked:opacity-100 transition-opacity shadow-hard-hover scale-0 peer-checked:scale-100 duration-200 z-10">
                        <Check className="w-4 h-4 text-fun-cream stroke-[4px]" />
                      </div>
                    </label>
                  );
                })}
             </div>
          </fieldset>
        </form>
      </div>
    </dialog>
  );
}
