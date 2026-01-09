import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigation, type Navigation } from "react-router";

import { SearchLoaderContext } from "./hook";
import type { SearchLoaderState } from "./types";

// A tiny buffer to bridge the gap between "submitting" -> "loading"
// This prevents the loader from flickering off during the router state transition.
const EXIT_DELAY_MS = 300;

const defaultState: SearchLoaderState = {
  visible: false,
  message: undefined
};

function detectLoaderState(navigation: Navigation): SearchLoaderState {
  if (navigation.state === "submitting" && navigation.formAction?.startsWith("/searches")) {
    return { visible: true };
  } else if (navigation.state === "loading" && navigation.formMethod != null) {
    return { visible: true };
  } else {
    return defaultState;
  }
}

export function SearchLoaderProvider({ children }: { children: React.ReactNode }) {
  const navigation = useNavigation();

  const [activeState, setActiveState] = useState<SearchLoaderState>(defaultState);
  const [manualState, setManualState] = useState<SearchLoaderState>(defaultState);
  const exitDelayTimerRef = useRef<number | null>(null);

  const detected = detectLoaderState(navigation);
  const shouldShow = detected.visible || manualState.visible;
  const targetMessage = detected.visible ? detected.message : manualState.message;

  if (shouldShow && !activeState.visible) {
    setActiveState({ visible: true, message: targetMessage });
  }

  useEffect(() => {
    if (!shouldShow && activeState.visible) {
      if (exitDelayTimerRef.current) {
        clearTimeout(exitDelayTimerRef.current);
      }

      exitDelayTimerRef.current = setTimeout(() => {
        setActiveState({ visible: false, message: undefined });
        exitDelayTimerRef.current = null;
      }, EXIT_DELAY_MS);
    }

    return () => {
      if (exitDelayTimerRef.current) {
        clearTimeout(exitDelayTimerRef.current);
      }
    };
  }, [shouldShow, activeState.visible]);

  const setManualLoader = useCallback((visible: boolean, message?: string) => {
    setManualState({ visible, message });
  }, []);

  return (
    <SearchLoaderContext.Provider value={{ setManualLoader, state: activeState }}>
      {children}
    </SearchLoaderContext.Provider>
  );
}
