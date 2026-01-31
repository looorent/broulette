import { Crosshair, Loader2, MapPin, XCircle } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useFetcher, useRouteLoaderData } from "react-router";

import { useAlertContext } from "@components/alert";
import { getDeviceLocation, getGeolocationPermissionStatus, isGeolocationSupported, useDebounce } from "@features/browser.client";
import { createDeviceLocation, hasCoordinates, type LocationPreference } from "@features/search";
import { logger } from "@features/utils/logger";
import type { action as addressLoader } from "@routes/_.api.address-searches";
import type { loader as rootLoader } from "src/root";

import { LocationSuggestionSelector } from "./location-suggestion-selector";

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
    const { submit } = fetcher;
    const session = useRouteLoaderData<typeof rootLoader>("root");

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
        submit(
          {
            query: debouncedSearchText,
            csrf: session?.csrfToken ?? ""
          },
          {
            method: "POST",
            action: "/api/address-searches"
          }
        );
        setShowSuggestions(true);
      }
    }, [debouncedSearchText, isSearchMode, submit, session?.csrfToken]);

    const handleSelectSuggestion = (suggestion: LocationPreference) => {
      setSearchText("");
      setShowSuggestions(false);
      onChange(suggestion);
      closeSearchMode();
    };

    const openGeolocationErrorInAlert = (message?: string) => {
      openAlert({
        title: message ?? "Geolocation is not supported by your browser.",
        variant: "danger",
        showCloseButton: false,
        actions: (
          <button
            type="button"
            onClick={closeAlert}
            className={`
              inline-flex w-full -rotate-1 cursor-pointer justify-center
              rounded-md border-2 border-fun-dark bg-fun-red px-4 py-2 font-pop
              text-sm font-bold tracking-wider text-fun-cream uppercase
              shadow-hard transition-all duration-150 ease-out
              hover:translate-x-0.5 hover:translate-y-0.5 hover:scale-105
              hover:rotate-0 hover:shadow-none
              sm:ml-3 sm:w-auto
            `}>
            Dismiss
          </button>
        ),
        children: (
          <p className="mt-2 font-sans text-fun-dark">
            Please try updating your browser or enabling permissions in your settings.
          </p>
        )
      });
    };

    const triggerDeviceLocation = async () => {
      if (isGeolocationSupported()) {
        const permission = await getGeolocationPermissionStatus();
        if (permission === "denied") {
          openGeolocationErrorInAlert("Location access is denied. Please enable it in your browser settings.");
        } else {
          setIsLocating(true);
          setShowSuggestions(false);

          try {
            const position = await getDeviceLocation();
            const deviceLocation = createDeviceLocation(position.coords);
            onChange(deviceLocation);
            closeSearchMode();
          } catch (e: any) {
            logger.error(e);
            if (e?.code === 1) {
              openGeolocationErrorInAlert("Location access was denied.");
            } else if (e?.code === 3) {
              openGeolocationErrorInAlert("Location request timed out. Please try again.");
            } else {
              openGeolocationErrorInAlert("Unable to retrieve location.");
            }
          } finally {
            setIsLocating(false);
          }
        }
      } else {
        openGeolocationErrorInAlert("Geolocation is not supported by your browser.");
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
        <div id="location-search" className="group relative mr-1" ref={wrapperRef}>
          {/* Main Container */}
          <div className={`
            relative flex items-center overflow-hidden rounded-2xl border-4
            border-fun-dark p-2 shadow-hard transition-all duration-300
            ${isSearchMode ? `
              bg-fun-cream
              focus-within:translate-y-0.5 focus-within:shadow-hard-hover
            ` : (isInvalidDeviceLocation ? `bg-fun-red` : `bg-fun-yellow`)}
          `}>
            {/* Left Icon */}
            <div className="mr-3 ml-2 shrink-0">
              {isLocating ? (
                <Loader2 className={`
                  h-6 w-6 animate-spin stroke-3 text-fun-dark transition-colors
                `} />
              ) : (
                <MapPin className={`
                  h-6 w-6 stroke-3 text-fun-dark transition-colors
                `} />
              )}
            </div>

            {/* Text Display or Input Field */}
            {isSearchMode ? (
              <input
                type="text"
                ref={inputRef}
                placeholder="City, neighborhood..."
                className={`
                  min-w-0 flex-1 bg-transparent font-sans text-lg font-medium
                  text-fun-dark outline-none
                  placeholder:text-fun-dark/40
                `}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                onFocus={() => setShowSuggestions(searchText.length > 0)}
                autoComplete="off"
              />
            ) : (
              <div className={`
                min-w-0 flex-1 truncate font-sans text-lg font-bold duration-200
              `}>
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
                  className={`
                    flex items-center rounded-xl border-2 border-fun-dark
                    bg-fun-yellow px-3 py-1.5 font-bold tracking-wider
                    text-fun-dark uppercase shadow-hard-hover transition-colors
                    active:scale-95
                    disabled:cursor-not-allowed disabled:opacity-70
                  `}
                  aria-label="Use my current device location"
                >
                  <Crosshair className="h-5 w-5 stroke-[2.5px]" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={enableSearchMode}
                  disabled={isLocating}
                  className={`
                    flex cursor-pointer items-center rounded-xl border-2
                    border-fun-dark bg-fun-cream px-3 py-1.5 font-bold
                    tracking-wider text-fun-dark uppercase shadow-hard-hover
                    transition-colors
                    hover:bg-white
                    active:scale-95
                    disabled:cursor-not-allowed disabled:opacity-70
                  `}
                  aria-label="Change location"
                >
                  <XCircle className="h-5 w-5 stroke-3 text-fun-dark" />
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
