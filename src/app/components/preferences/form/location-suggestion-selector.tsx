import { History } from "lucide-react";
import { type LocationPreference } from "~/types/location";

interface LocationSuggestionSelectorProps {
  suggestions: LocationPreference[];
  onSelect: (suggestion: LocationPreference) => void;
}

export function LocationSuggestionSelector({ suggestions, onSelect }: LocationSuggestionSelectorProps) {
  return (
    <div className="
      absolute top-full left-0 w-full mt-2 z-50
      bg-white border-4 border-fun-dark rounded-2xl shadow-hard
      overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200
    ">
      <ul className="max-h-60 overflow-y-auto no-scrollbar py-1"
        role="listbox">
        {suggestions.map((suggestion, index) => (
          <li key={index}>
            <button
              type="button"
              onClick={() => onSelect(suggestion)}
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
      <div className="bg-fun-cream border-t-2 border-fun-dark/10 px-4 py-1 text-[10px] font-bold text-fun-dark/40 uppercase tracking-widest text-center">
        Suggestions
      </div>
    </div>
  );
}
