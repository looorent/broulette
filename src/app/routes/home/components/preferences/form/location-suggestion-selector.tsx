import { History, Loader2 } from "lucide-react";
import { type LocationPreference } from "~/types/location";
import { SkeletonList } from "./location-skeleton-list";

interface LocationSuggestionSelectorProps {
  suggestions: LocationPreference[] | undefined;
  note: string | undefined;
  isSearching: boolean;
  onSelect: (suggestion: LocationPreference) => void;
}

export function LocationSuggestionSelector({ suggestions, note, isSearching, onSelect }: LocationSuggestionSelectorProps) {
  return (
    <div className="
      absolute top-full left-0 w-full mt-2 z-50
      bg-white border-4 border-fun-dark rounded-2xl shadow-hard
      overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200
    ">
      {
        isSearching ? (
          <SkeletonList />
        ) : (suggestions && suggestions.length > 0 ? (
          <>
            <ul className="max-h-60 overflow-y-auto no-scrollbar py-1"
                role="listbox">
              { suggestions.map((suggestion, index) => (
                  <li key={index}>
                    <button
                      type="button"
                      onClick={() => onSelect(suggestion)}
                      className="
                        w-full text-left px-4 py-3
                        font-sans font-bold text-fun-dark
                        hover:bg-fun-yellow/20 active:bg-fun-yellow/50
                        flex items-center gap-3 transition-colors
                        truncate
                      "
                    >
                      <History className="w-4 h-4 text-fun-dark/50 truncate" />
                      {suggestion.label.display}
                    </button>
                  </li>
                )
              )}
            </ul>

            { note ? (
              <div className="bg-fun-cream border-t-2 border-fun-dark/10 px-4 py-1 text-[10px] font-bold text-fun-dark/40 uppercase tracking-widest text-center">
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
