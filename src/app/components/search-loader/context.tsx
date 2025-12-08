import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavigation, type Navigation } from "react-router";
import type { SearchLoaderState } from "./types";

// The loader will always stay visible for at least this long.
// This prevents it from flashing on/off if a user clicks fast or the API is too fast.
const MIN_DURATION_MS = 1000;

export interface SearchLoaderContextType {
  setManualLoader: (visible: boolean, message?: string) => void;
  state: SearchLoaderState;
}

const defaultState: SearchLoaderState = {
  visible: false,
  message: undefined
};

function detectLoaderState(navigation: Navigation): SearchLoaderState {
  if (navigation.state === "submitting" && navigation.formAction?.startsWith("/searches")) {
    // Check for submission to specific path
    return { visible: true, message: "Searching..." };
  } else if (navigation.state === "loading" && navigation.formMethod != null) {
    // Check for the loading phase (redirect/revalidation) after a submission
    return { visible: true, message: "Loading..." };
  } else {
    return defaultState;
  }
}

const SearchLoaderContext = createContext<SearchLoaderContextType | undefined>(undefined);

export function SearchLoaderProvider({ children }: { children: React.ReactNode }) {
  const navigation = useNavigation();
  const [state, setState] = useState<SearchLoaderState>(defaultState);
  const [manualState, setManualState] = useState<SearchLoaderState>(defaultState);
  const startTimeRef = useRef<number | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const detected = detectLoaderState(navigation);
    const isNavigating = navigation.state !== "idle" && detected.visible;

    const shouldShow = isNavigating || manualState.visible;
    const message = isNavigating ? detected.message : manualState.message;

    if (shouldShow) {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }

      if (!state.visible) {
        startTimeRef.current = Date.now();
        setState({ visible: true, message });
      } else {
        setState((prev) => (prev.message === message ? prev : { ...prev, message }));
      }
    } else {
      if (state.visible && startTimeRef.current) {
        const elapsed = Date.now() - startTimeRef.current;
        const remainingTime = MIN_DURATION_MS - elapsed;

        if (remainingTime > 0) {
          if (!hideTimerRef.current) {
            hideTimerRef.current = setTimeout(() => {
              setState({ visible: false, message: undefined });
              startTimeRef.current = null;
              hideTimerRef.current = null;
            }, remainingTime);
          }
        } else {
          setState({ visible: false, message: undefined });
          startTimeRef.current = null;
        }
      }
    }

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [navigation, manualState, state.visible]);

  const setManualLoader = useCallback((visible: boolean, message?: string) => {
    setManualState({ visible, message });
  }, []);

  return (
    <SearchLoaderContext.Provider value={{ setManualLoader, state }}>
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
