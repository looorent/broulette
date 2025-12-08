import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavigation, type Navigation } from "react-router";
import type { SearchLoaderState } from "./types"; // Assuming this exists

export interface SearchLoaderContextType {
  setManualLoader: (visible: boolean, message?: string) => void;
  state: SearchLoaderState;
}

const defaultState: SearchLoaderState = {
  visible: false,
  message: undefined
};

function detectLoaderState(navigation: Navigation): SearchLoaderState {
  // Check for submission to specific path
  if (navigation.state === "submitting" && navigation.formAction?.startsWith("/searches")) {
    return { visible: true, message: "Searching..." };
  }

  // Check for the loading phase (redirect/revalidation) after a submission
  if (navigation.state === "loading" && navigation.formMethod != null) {
    return { visible: true, message: "Loading results..." };
  }

  return defaultState;
}

const SearchLoaderContext = createContext<SearchLoaderContextType | undefined>(undefined);

const DELAY_IN_MS = 300;

export function SearchLoaderProvider({ children }: { children: React.ReactNode }) {
  const navigation = useNavigation();
  const [state, setState] = useState<SearchLoaderState>(defaultState);
  const [manualState, setManualState] = useState<SearchLoaderState>(defaultState);
  const latestMessageRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const detected = detectLoaderState(navigation);
    const shouldShow = detected.visible || manualState.visible;
    const message = detected.visible ? detected.message : manualState.message;
    latestMessageRef.current = message;

    let timeoutId: NodeJS.Timeout;

    if (shouldShow) {
      if (state.visible) {
        setState((prev) => (prev.message === message ? prev : { visible: true, message }));
      } else {
        timeoutId = setTimeout(() => setState({ visible: true, message: latestMessageRef.current }), DELAY_IN_MS);
      }
    } else {
      setState(defaultState);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [navigation.state, navigation.formAction, navigation.formMethod, manualState, state.visible]);

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
