import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { SearchLoaderState } from "./types";

export interface SearchLoaderContextType {
  showLoader: (message?: string, delay?: number) => void;
  hideLoader: () => void;
  state: SearchLoaderState;
}

const defaultState: SearchLoaderState = {
  visible: false,
  message: undefined
};

const SearchLoaderContext = createContext<SearchLoaderContextType | undefined>(undefined);

export function SearchLoaderProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SearchLoaderState>(defaultState);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const showLoader = useCallback((message?: string, delay: number = 200) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (delay === 0) {
      setState({ visible: true, message });
    } else {
      timerRef.current = setTimeout(() => {
        setState({ visible: true, message });
      }, delay);
    }
  }, []);

  const hideLoader = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <SearchLoaderContext.Provider value={{ showLoader, hideLoader, state }}>
      {children}
    </SearchLoaderContext.Provider>
  );
}

export function useSearchLoader() {
  const context = useContext(SearchLoaderContext);
  if (!context) {
    throw new Error("useSearchLoader must be used within a SearchLoaderProvider");
  } else {
    return context;
  }
}
