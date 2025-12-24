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
    // Check for submission to specific path
    return { visible: true };
  } else if (navigation.state === "loading" && navigation.formMethod != null) {
    // Check for the loading phase (redirect/revalidation) after a submission
    return { visible: true };
  } else {
    return defaultState;
  }
}

export function SearchLoaderProvider({ children }: { children: React.ReactNode }) {
  const navigation = useNavigation();
  const [state, setState] = useState<SearchLoaderState>(defaultState);
  const [manualState, setManualState] = useState<SearchLoaderState>(defaultState);
  const exitDelayTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const detected = detectLoaderState(navigation);
    const isNavigating = navigation.state !== "idle" && detected.visible;
    const shouldShow = isNavigating || manualState.visible;
    const message = isNavigating ? detected.message : manualState.message;

    if (shouldShow) {
      // Cancel any pending exit timer.
      // If we were about to hide but a new signal came in (e.g. submitting -> loading transition),
      // we cancel the hide to keep the loader visible seamlessly.
      if (exitDelayTimerRef.current) {
        clearTimeout(exitDelayTimerRef.current);
        exitDelayTimerRef.current = null;
      }

      // Show immediately or update message
      if (!state.visible) {
        if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
        setState({ visible: true, message });
      } else {
        // Only trigger a re-render if the message actually changed
        setState((prev) => (prev.message === message ? prev : { ...prev, message }));
      }

    } else {
      // Don't hide immediately! Wait 300ms to see if this is just a router state gap.
      // Only set this if we aren't already waiting for an exit delay.
      if (state.visible && !exitDelayTimerRef.current) {
        exitDelayTimerRef.current = setTimeout(() => {
          setState({ visible: false, message: undefined });
          exitDelayTimerRef.current = null;
        }, EXIT_DELAY_MS);
      }
    }

    return () => {
      if (exitDelayTimerRef.current) {
        clearTimeout(exitDelayTimerRef.current);
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

