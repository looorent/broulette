import { History } from "lucide-react";

import type { LocationPreference } from "@features/search";

import { SkeletonList } from "./location-skeleton-list";

interface LocationSuggestionSelectorProps {
  suggestions: LocationPreference[] | undefined;
  note: string | undefined;
  isSearching: boolean;
  onSelect: (suggestion: LocationPreference) => void;
}

export function LocationSuggestionSelector({ suggestions, note, isSearching, onSelect }: LocationSuggestionSelectorProps) {
  return (
    <div className={`
      absolute top-full left-0 z-50 mt-2 w-full overflow-hidden rounded-2xl
      border-4 border-fun-dark bg-white shadow-hard duration-200
    `}>
      {
        isSearching ? (
          <SkeletonList />
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
