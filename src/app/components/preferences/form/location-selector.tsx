import { Crosshair, Loader2, MapPin, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { getBrowserLocation } from "~/functions/geolocation";
import type { action as addressLoader } from "~/routes/api/address-search";
import { createDeviceLocation, hasCoordinates, type LocationPreference } from "~/types/location";
import { LocationSuggestionSelector } from "./location-suggestion-selector";

interface LocationSelectorProps {
  selectedLocation: LocationPreference;
  onChange: (location: LocationPreference) => void;
}

export function LocationSelector({ selectedLocation, onChange }: LocationSelectorProps) {
  const [searchText, setSearchText  ] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fetcher = useFetcher<typeof addressLoader>();

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
    if (!isSearchMode || searchText.trim().length === 0) {
      setShowSuggestions(false);
    } else {
      const timeoutId = setTimeout(() => {
        fetcher.submit(
          { query: searchText },
          {
            method: "post",
            action: "/api/address-searches"
          }
        );
        setShowSuggestions(true);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchText, isSearchMode, fetcher]);

  const handleSelectSuggestion = (suggestion: LocationPreference) => {
    setSearchText(suggestion?.label?.display || "");
    setShowSuggestions(false);
    onChange(suggestion);
    closeSearchMode();
  };

  const triggerDeviceLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser"); // TODO
      return;
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
        alert("Unable to retrieve your location.");
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
    <div id="location-search" className="relative group" ref={wrapperRef}>
      {/* Glow Effect */}
      <div className="absolute -inset-1 bg-fun-dark rounded-2xl blur opacity-20 group-hover:opacity-40 transition"></div>

      {/* Main Container */}
      <div className={`
        relative border-4 border-fun-dark rounded-2xl shadow-hard flex items-center p-2
        transition-all duration-300
        ${isSearchMode ? "bg-fun-cream focus-within:translate-y-0.5 focus-within:shadow-hard-hover" : (isInvalidDeviceLocation ? "bg-fun-red" : "bg-fun-yellow") }
      `}>
        {/* Left Icon */}
        <div className="ml-2 mr-3">
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
          <div className="flex-1 min-w-0 font-sans font-bold text-lg animate-in fade-in zoom-in duration-200">
            {deviceLocationSupported ? (
              selectedLocation?.isDeviceLocation && !hasCoordinates(selectedLocation)
              ? "Location not allowed"
              : selectedLocation?.label?.display || ""
            ): "Location not supported"}
          </div>
        )}

        {/* Action Button (Right Side) */}
        <div className="ml-2">
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
      {isSearchMode && showSuggestions && fetcher.data?.locations && (
        <LocationSuggestionSelector suggestions={fetcher.data.locations} onSelect={handleSelectSuggestion} />
      )}
    </div>
  );
}
