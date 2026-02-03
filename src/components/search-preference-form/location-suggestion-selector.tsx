import { AlertTriangle, History, RefreshCw } from "lucide-react";

import type { LocationPreference } from "@features/search";

import { SkeletonList } from "./location-skeleton-list";

interface LocationSuggestionSelectorProps {
  suggestions: LocationPreference[] | undefined;
  note: string | undefined;
  error: string | undefined;
  isSearching: boolean;
  onSelect: (suggestion: LocationPreference) => void;
  onRetry: () => void;
}

export function LocationSuggestionSelector({ suggestions, note, error, isSearching, onSelect, onRetry }: LocationSuggestionSelectorProps) {
  return (
    <div className={`
      absolute top-full left-0 z-50 mt-2 w-full overflow-hidden rounded-2xl
      border-4 border-fun-dark bg-white shadow-hard duration-200
    `}>
      {
        isSearching ? (
          <SkeletonList />
        ) : error ? (
          <div className="p-4 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <AlertTriangle className="h-5 w-5 text-fun-red" />
              <p className="font-sans text-sm font-bold text-fun-dark">
                {error}
              </p>
            </div>
            <button
              type="button"
              onClick={onRetry}
              className={`
                inline-flex items-center gap-2 rounded-lg border-2
                border-fun-dark bg-fun-yellow px-4 py-2 font-sans text-sm
                font-bold text-fun-dark transition-all
                hover:bg-fun-yellow/80 hover:shadow-hard-hover
                active:scale-95
              `}
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        ) : (suggestions && suggestions.length > 0 ? (
          <>
            <ul className="max-h-60 overflow-y-auto py-1"
                role="listbox">
              { suggestions.map((suggestion, index) => (
                  <li key={index}>
                    <button
                      type="button"
                      onClick={() => onSelect(suggestion)}
                      className={`
                        flex w-full items-center gap-3 truncate px-4 py-3
                        text-left font-sans font-bold text-fun-dark
                        transition-colors
                        hover:bg-fun-yellow/20
                        active:bg-fun-yellow/50
                      `}
                    >
                      <History className="h-4 w-4 truncate text-fun-dark/50" />
                      {suggestion.label.display}
                    </button>
                  </li>
                )
              )}
            </ul>

            { note ? (
              <div className={`
                border-t-2 border-fun-dark/10 bg-fun-cream px-4 py-1 text-center
                text-[10px] font-bold tracking-widest text-fun-dark/40 uppercase
              `}>
                {note}
              </div>
            ) : null}
          </>
        ) : (
          <div className="p-4 text-center">
            <p className="text-sm font-bold text-fun-dark/50 italic">
              No locations found
            </p>
          </div>
        ))
      }
    </div>
  );
}
