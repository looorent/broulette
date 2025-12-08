import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { SearchLoaderState } from "./types";
import { useNavigation, type Navigation } from "react-router";

export interface SearchLoaderContextType {
  setManualLoader: (visible: boolean, message?: string) => void;
  state: SearchLoaderState;
}

function detectLoaderState(navigation: Navigation): SearchLoaderState {
  if (navigation.state === "submitting" && navigation.formAction?.startsWith("/searches")) {
    // Submit a search or a selection
    return {
      visible: true,
      message: "TODO"
    };
  } else if (navigation.state === "loading" && navigation.formMethod != null) {
    // Redirecting to a view page after a submission
    return {
      visible: true,
      message: "TODO"
    };
  } else {
    return defaultState;
  }
}

const defaultState: SearchLoaderState = {
  visible: false,
  message: undefined
};

const SearchLoaderContext = createContext<SearchLoaderContextType | undefined>(undefined);

const DELAY_IN_MS = 1000;

export function SearchLoaderProvider({ children }: { children: React.ReactNode }) {
  const navigation = useNavigation();
  const [state, setState] = useState<SearchLoaderState>(defaultState);
  const [manualState, setManualState] = useState<SearchLoaderState>(defaultState);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const detectedState = detectLoaderState(navigation);
    const isNavigating = navigation.state !== "idle" && !!detectedState;
    const shouldShow = isNavigating || manualState.visible;
    const message = isNavigating ? detectedState.message : manualState.message;

    if (shouldShow) {
      if (!state.visible && !timerRef.current) {
        timerRef.current = setTimeout(() => setState({ visible: true, message }), DELAY_IN_MS);
      }
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setState({ visible: false, message: undefined });
    }
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
