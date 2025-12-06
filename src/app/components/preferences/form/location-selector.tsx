import { Crosshair, Loader2, MapPin, XCircle } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { getBrowserLocation } from "~/functions/address/browser-location";
import { useDebounce } from "~/functions/debounce";
import type { action as addressLoader } from "~/routes/api/address-search";
import { createDeviceLocation, hasCoordinates, type LocationPreference } from "~/types/location";
import { LocationSuggestionSelector } from "./location-suggestion-selector";
import GeolocationAlert from "~/components/home/geolocation-alert";

export interface LocationSelectorHandle {
  handleClose: () => void;
}

interface LocationSelectorProps {
  selectedLocation: LocationPreference;
  onChange: (location: LocationPreference) => void;
}

export const LocationSelector = forwardRef<LocationSelectorHandle, LocationSelectorProps>(
  (
    { selectedLocation, onChange }, ref
  ) => {
    const [searchText, setSearchText] = useState("");
    const [isLocating, setIsLocating] = useState(false);
    const [isSearchMode, setIsSearchMode] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showGeoError, setShowGeoError] = useState(false);
    const debouncedSearchText = useDebounce(searchText, 300);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fetcher = useFetcher<typeof addressLoader>();

    useImperativeHandle(ref, () => ({
      handleClose: () => {
        setSearchText("");
        setShowSuggestions(false);
        closeSearchMode();
      },
    }));

    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
          setShowSuggestions(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Search and debounce
    useEffect(() => {
      if (!isSearchMode || debouncedSearchText.trim().length === 0) {
        setShowSuggestions(false);
      } else {
        fetcher.submit(
          { query: debouncedSearchText },
          {
            method: "post",
            action: "/api/address-searches"
          }
        );
        setShowSuggestions(true);
      }
    }, [debouncedSearchText, isSearchMode]);

    const handleSelectSuggestion = (suggestion: LocationPreference) => {
      setSearchText("");
      setShowSuggestions(false);
      onChange(suggestion);
      closeSearchMode();
    };

    const triggerDeviceLocation = async () => {
      if (navigator.geolocation) {
        setShowGeoError(true);
      } else {
        setIsLocating(true);
        setShowSuggestions(false);

        try {
          const position = await getBrowserLocation();
          const deviceLocation = createDeviceLocation(position.coords);
          onChange(deviceLocation);
          closeSearchMode();
        } catch (e) {
          console.error(e);
          setShowGeoError(true);
        } finally {
          setIsLocating(false);
        }
      }
    };

    const enableSearchMode = () => {
      setIsLocating(false);
      setIsSearchMode(true);
      setSearchText("");
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 1);
    };

    const closeSearchMode = () => {
      setIsLocating(false);
      setIsSearchMode(false);
      setSearchText("");
    };

    const deviceLocationSupported = typeof navigator !== "undefined" && Boolean(navigator.geolocation);
    const isInvalidDeviceLocation = !deviceLocationSupported || (selectedLocation?.isDeviceLocation && !hasCoordinates(selectedLocation));

    return (
      <>
        <GeolocationAlert
          isOpen={showGeoError}
          onClose={() => setShowGeoError(false)}
        />
        <div id="location-search" className="relative group" ref={wrapperRef}>

          {/* Glow Effect */}
          <div className="absolute -inset-1 bg-fun-dark rounded-2xl blur opacity-20 group-hover:opacity-40 transition"></div>

          {/* Main Container */}
          <div className={`
            relative border-4 border-fun-dark rounded-2xl shadow-hard flex items-center p-2
            transition-all duration-300
            overflow-hidden
            ${isSearchMode ? "bg-fun-cream focus-within:translate-y-0.5 focus-within:shadow-hard-hover" : (isInvalidDeviceLocation ? "bg-fun-red" : "bg-fun-yellow")}
        `}>
            {/* Left Icon */}
            <div className="ml-2 mr-3 shrink-0">
              {isLocating ? (
                <Loader2 className="w-6 h-6 stroke-3 transition-colors text-fun-dark animate-spin" />
              ) : (
                <MapPin className="w-6 h-6 stroke-3 transition-colors text-fun-dark" />
              )}
            </div>

            {/* Text Display or Input Field */}
            {isSearchMode ? (
              <input
                type="text"
                ref={inputRef}
                placeholder="City, neighborhood..."
                className="flex-1 min-w-0 bg-transparent font-sans font-medium text-lg text-fun-dark placeholder:text-fun-dark/40 outline-none"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                onFocus={() => setShowSuggestions(searchText.length > 0)}
                autoComplete="off"
              />
            ) : (
              <div className="flex-1 min-w-0 truncate font-sans font-bold text-lg animate-in fade-in zoom-in duration-200">
                {deviceLocationSupported ? (
                  selectedLocation?.isDeviceLocation && !hasCoordinates(selectedLocation)
                    ? "Location not allowed"
                    : selectedLocation?.label?.display || ""
                ) : "Location not supported"}
              </div>
            )}

            {/* Action Button (Right Side) */}
            <div className="ml-2 shrink-0">
              {isSearchMode ? (
                <button
                  type="button"
                  onClick={triggerDeviceLocation}
                  className="bg-fun-yellow text-fun-dark border-2 border-fun-dark px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider hover:bg-yellow transition-colors flex items-center shadow-hard-hover active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                  aria-label="Use my current device location"
                >
                  <Crosshair className="w-5 h-5 stroke-[2.5px]" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={enableSearchMode}
                  disabled={isLocating}
                  className="bg-fun-cream text-fun-dark border-2 border-fun-dark px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider hover:bg-white transition-colors flex items-center shadow-hard-hover active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                  aria-label="Change location"
                >
                  <XCircle className="w-5 h-5 text-fun-dark stroke-3" />
                </button>
              )}
            </div>
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchMode && showSuggestions && (fetcher.data?.locations || fetcher.state !== "idle") && (
            <LocationSuggestionSelector suggestions={fetcher.data?.locations}
              note={fetcher.data?.note}
              isSearching={fetcher.state !== "idle"}
              onSelect={handleSelectSuggestion} />
          )}
        </div>
      </>
    );
  }
);

LocationSelector.displayName = "LocationSelector";
