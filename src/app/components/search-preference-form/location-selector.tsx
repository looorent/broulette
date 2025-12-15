import { Crosshair, Loader2, MapPin, XCircle } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { LocationSuggestionSelector } from "./location-suggestion-selector";
import { createDeviceLocation, hasCoordinates, type LocationPreference } from "@features/search";
import { getDeviceLocation, isGeolocationSupported, useDebounce } from "@features/browser.client";
import { useAlertContext } from "@components/alert/context";
import type { action as addressLoader } from "@routes/_.api.address-searches";

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
    const debouncedSearchText = useDebounce(searchText, 300);
    const { openAlert, closeAlert } = useAlertContext();

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

    const openGeolocationErrorInAlert = () => {
      openAlert({
        title: "Geolocation is not supported by your browser.",
        variant: "danger",
        showCloseButton: false,
        actions: (
          <button
            type="button"
            onClick={closeAlert}
            className="
            inline-flex w-full justify-center rounded-md
            bg-fun-red px-4 py-2
            text-sm font-bold uppercase tracking-wider
            border-2 border-fun-dark shadow-hard
            hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5
            text-fun-cream
            transition-all duration-150 ease-out
            sm:ml-3 sm:w-auto
            cursor-pointer
            -rotate-1 hover:rotate-0 hover:scale-105
            font-pop
          ">
            Dismiss
          </button>
        ),
        children: (
          <p className="text-fun-dark mt-2 font-sans">
            Please try updating your browser or enabling permissions in your settings.
          </p>
        )
      });
    };

    const triggerDeviceLocation = async () => {
      if (isGeolocationSupported()) {
        setIsLocating(true);
        setShowSuggestions(false);

        try {
          const position = await getDeviceLocation();
          const deviceLocation = createDeviceLocation(position.coords);
          onChange(deviceLocation);
          closeSearchMode();
        } catch (e) {
          console.error(e);
          openGeolocationErrorInAlert();
        } finally {
          setIsLocating(false);
        }
      } else {
        openGeolocationErrorInAlert();
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

    const deviceLocationSupported = isGeolocationSupported();
    const isInvalidDeviceLocation = !deviceLocationSupported || (selectedLocation?.isDeviceLocation && !hasCoordinates(selectedLocation));

    return (
      <>
        <div id="location-search" className="relative group mr-1" ref={wrapperRef}>
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
                  className="bg-fun-cream
                    text-fun-dark border-2 border-fun-dark
                    px-3 py-1.5
                    rounded-xl
                    font-bold uppercase
                    tracking-wider
                    hover:bg-white transition-colors
                    flex items-center
                    shadow-hard-hover
                    cursor-pointer
                    active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                  aria-label="Change location"
                >
                  <XCircle className="w-5 h-5 text-fun-dark stroke-3" />
                </button>
              )}
            </div>
          </div>

          {isSearchMode && showSuggestions && (fetcher.data?.locations || fetcher.state !== "idle") && (
            <LocationSuggestionSelector
              suggestions={fetcher.data?.locations}
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
