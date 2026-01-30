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

const MESSAGE_MIN_DURATION = 1_000;
export function SearchLoaderProvider({ children }: { children: React.ReactNode }) {
  const navigation = useNavigation();
  const { pathname } = useLocation();

  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [instantMessage, setInstantMessage] = useState<string | null>(null);
  const currentMessage = instantMessage ?? messages[0];

  const [activeVisible, setActiveVisible] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appearanceTime = useRef<number | null>(null);

  const rawVisibility = detectRawVisibility(navigation, pathname, isStreaming);

  if (rawVisibility && !activeVisible) {
    setActiveVisible(true);
  }

  useEffect(() => {
    if (messages.length > 0 && !instantMessage) {
      const timer = setTimeout(() => {
        setMessages(prev => prev.slice(1));
      }, MESSAGE_MIN_DURATION);
      return () => clearTimeout(timer);
    }
  }, [messages, instantMessage]);

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
        setMessages([]);
        setInstantMessage(null);
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
    message: currentMessage
  }), [activeVisible, isStreaming, currentMessage]);

  const setLoaderMessage = useCallback((message: string, instant: boolean = false) => {
    if (instant) {
      setMessages([]);
      setInstantMessage(message);
    } else {
      setInstantMessage(null);
      setMessages((prev) => [...prev, message]);
    }
  }, []);

  const setLoaderStreaming = useCallback((streaming: boolean) => setIsStreaming(streaming), []);

  return (
    <SearchLoaderContext.Provider value={{ setLoaderMessage, setLoaderStreaming, state }}>
      {children}
    </SearchLoaderContext.Provider>
  );
}
