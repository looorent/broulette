import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { matchPath, useLocation, useNavigation, type Navigation } from "react-router";

import { SearchLoaderContext } from "./hook";

const MIN_STAY_VISIBLE_MS = 3000;
const HIDE_DEBOUNCE_MS = 100;

function detectRawVisibility(navigation: Navigation, pathname: string, isStreaming: boolean): boolean {
  const isOnAPageStreaming = !!matchPath("/searches/:searchId", pathname) ||
    !!matchPath("/searches/:searchId/candidates/:candidateId", pathname);

  return (
    (navigation.state === "submitting" && navigation.formAction?.startsWith("/searches")) ||
    (navigation.state === "loading" && navigation.formMethod != null) ||
    (isOnAPageStreaming && isStreaming)
  );
}

export function SearchLoaderProvider({ children }: { children: React.ReactNode }) {
  const navigation = useNavigation();
  const { pathname } = useLocation();

  const [isStreaming, setIsStreaming] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);

  const [activeVisible, setActiveVisible] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appearanceTime = useRef<number | null>(null);

  const rawVisibility = detectRawVisibility(navigation, pathname, isStreaming);

  if (rawVisibility && !activeVisible) {
    setActiveVisible(true);
  }

  useEffect(() => {
    if (rawVisibility) {
      if (appearanceTime.current === null) {
        appearanceTime.current = Date.now();
      }

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    } else if (activeVisible) {
      const elapsed = appearanceTime.current ? Date.now() - appearanceTime.current : 0;

      const remainingMinTime = Math.max(0, MIN_STAY_VISIBLE_MS - elapsed);
      const finalDelay = Math.max(remainingMinTime, HIDE_DEBOUNCE_MS);

      debounceTimer.current = setTimeout(() => {
        setActiveVisible(false);
        appearanceTime.current = null;
        debounceTimer.current = null;
      }, finalDelay);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [rawVisibility, activeVisible]);

  const state = useMemo(() => ({
    visible: activeVisible,
    streaming: isStreaming,
    message: message
  }), [activeVisible, isStreaming, message]);

  const setLoaderMessage = useCallback((message?: string) => setMessage(message), []);
  const setLoaderStreaming = useCallback((streaming: boolean) => setIsStreaming(streaming), []);

  return (
    <SearchLoaderContext.Provider value={{ setLoaderMessage, setLoaderStreaming, state }}>
      {children}
    </SearchLoaderContext.Provider>
  );
}
